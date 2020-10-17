import { loadAssets } from "./LoadHelper.js";
import Logger from "./logger.js";

export default class MapTile {

    /**     
     * @param {WebGLRenderingContext} gl 
     * @param {Logger} logger
     */
    static init(gl, logger) {
        MapTile.logger = logger;
        MapTile.loading = loadAssets(["./tiles.jpg", "./tilebg.png", "noise.png"], ["./maptile.vert", "./maptile.frag"]).then(assets => {
            MapTile.loadTexture(gl, [assets[0], assets[1], assets[2]]);
            MapTile.loadShaders(gl, assets[3], assets[4]);
            MapTile.loadModel(gl);
        });

        MapTile.loading.then(_ => this.logger.log("MapTile assets loaded"), err => this.logger.log("MapTile loading failed with error:" + err));


        return MapTile.loading;
    }

    /**     
     * @param {WebGLRenderingContext} gl 
     */
    static loadModel(gl) {
        let frontVertexes =
            [-1.0, -1.0, 0,
                1.0, -1.0, 0,
            -1.0, 1.0, 0,
                1.0, 1.0, 0
            ]

        let backVertexes =
            [1.0, -1.0, -0.1,
                -1.0, -1.0, -0.1,
                1.0, 1.0, -0.1,
                -1.0, 1.0, -0.1
            ]
        let sideVertexes = [
            -1, 1, 0,
            1, 1, 0,
            -1, 1, -0.1,
            1, 1, -0.1,
        ]

        let sideVertexesTc = [
            0, 0,
            1, 0,
            0, 0.1,
            1, 0.1
        ]
        let backVertexesTc = [
            0, 1,
            1, 1,
            0, 0,
            1, 0
        ]
        MapTile.vxFront = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, MapTile.vxFront);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(frontVertexes), gl.STATIC_DRAW);

        MapTile.vxFrontTc = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, MapTile.vxFrontTc);
        gl.bufferData(gl.ARRAY_BUFFER, 4 * 2 * 4, gl.DYNAMIC_DRAW);

        MapTile.vxSide = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, MapTile.vxSide);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sideVertexes), gl.STATIC_DRAW);

        MapTile.vxSideTc = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, MapTile.vxSideTc);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sideVertexesTc), gl.STATIC_DRAW);

        MapTile.vxBack = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, MapTile.vxBack);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(backVertexes), gl.STATIC_DRAW);

        MapTile.vxBackTc = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, MapTile.vxBackTc);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(backVertexesTc), gl.STATIC_DRAW);
    }

    /**     
     * @param {WebGLRenderingContext} gl 
     * @param {HTMLImageElement} textureData
     */
    static loadTexture(gl, images) {
        MapTile.texTileAtlas = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, MapTile.texTileAtlas);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[0]);
        gl.generateMipmap(gl.TEXTURE_2D);
        MapTile.texTileBack = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, MapTile.texTileBack);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[1]);
        gl.generateMipmap(gl.TEXTURE_2D);
        MapTile.texTileSide = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, MapTile.texTileSide);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[2]);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    /**     
     * @param {WebGLRenderingContext} gl 
     */
    static loadShaders(gl, vShaderSource, fShaderSource) {
        let vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vShaderSource);
        gl.compileShader(vertexShader);

        let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, fShaderSource);
        gl.compileShader(fragShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            MapTile.logger("vertex shader compilation failed");
            throw "Shader error";
        }

        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            MapTile.logger("frag shader compilation failed");
            throw "Shader error";
        }

        MapTile.program = gl.createProgram();
        gl.attachShader(MapTile.program, vertexShader);
        gl.attachShader(MapTile.program, fragShader);
        gl.linkProgram(MapTile.program);

        if (!gl.getProgramParameter(MapTile.program, gl.LINK_STATUS)) {
            MapTile.logger.log("Program creation failed");
            throw "Program failed";
        }

        MapTile.programInfo = {
            vPos: gl.getAttribLocation(MapTile.program, 'aVertexPosition'),
            tPos: gl.getAttribLocation(MapTile.program, 'aTexPosition'),
            pMat: gl.getUniformLocation(MapTile.program, 'uProjectionMatrix'),
            mvMat: gl.getUniformLocation(MapTile.program, 'uModelViewMatrix'),
            tSampler: gl.getUniformLocation(MapTile.program, 'uSampler')
        }
    }

    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {MapTile} tile 
     */
    static draw(gl, tiles, camera, pMatrix) {
        gl.useProgram(MapTile.program);
        gl.uniformMatrix4fv(MapTile.programInfo.pMat, false, pMatrix);
        gl.enableVertexAttribArray(MapTile.programInfo.tPos);
        gl.enableVertexAttribArray(MapTile.programInfo.vPos);
        tiles.forEach(tile => {
            let texX = tile.tileNum % 5;
            let texY = Math.trunc(tile.tileNum / 5);
            let texCoords = new Float32Array([0.20 * texX, 0.20 * texY,
            0.20 * (texX + 1), 0.20 * texY,
            0.20 * texX, 0.20 * (texY + 1),
            0.20 * (texX + 1), 0.20 * (texY + 1)]);
            gl.bindBuffer(gl.ARRAY_BUFFER, MapTile.vxFrontTc);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, texCoords);
            gl.vertexAttribPointer(MapTile.programInfo.tPos, 2, gl.FLOAT, false, 0, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, MapTile.texTileAtlas);
            gl.uniform1i(MapTile.programInfo.tSampler, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, MapTile.vxFront);
            gl.vertexAttribPointer(MapTile.programInfo.vPos, 3, gl.FLOAT, false, 0, 0);

            let mvMatrix = glMatrix.mat4.create()
            glMatrix.mat4.translate(mvMatrix, mvMatrix, [tile.x, tile.y, 0]);            
            glMatrix.mat4.scale(mvMatrix, mvMatrix, [0.5, 0.5, 0.5]);
            glMatrix.mat4.rotateX(mvMatrix, mvMatrix, tile.rotation*Math.PI)
            glMatrix.mat4.mul(mvMatrix, camera, mvMatrix);
            gl.uniformMatrix4fv(MapTile.programInfo.mvMat, false, mvMatrix);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            for (let i = 0; i < 4; i++) {
                mvMatrix = glMatrix.mat4.create()
                glMatrix.mat4.translate(mvMatrix, mvMatrix, [tile.x, tile.y, 0]);
                glMatrix.mat4.rotateX(mvMatrix, mvMatrix, tile.rotation*Math.PI)
                glMatrix.mat4.rotateZ(mvMatrix, mvMatrix, i * Math.PI / 2.0);
                glMatrix.mat4.scale(mvMatrix, mvMatrix, [0.5, 0.5, 0.5]);
                glMatrix.mat4.mul(mvMatrix, camera, mvMatrix);
                gl.bindBuffer(gl.ARRAY_BUFFER, MapTile.vxSideTc);
                gl.vertexAttribPointer(MapTile.programInfo.tPos, 2, gl.FLOAT, false, 0, 0);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, MapTile.texTileSide);
                gl.uniform1i(MapTile.programInfo.tSampler, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, MapTile.vxSide);
                gl.vertexAttribPointer(MapTile.programInfo.vPos, 3, gl.FLOAT, false, 0, 0);
                gl.uniformMatrix4fv(MapTile.programInfo.mvMat, false, mvMatrix);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            }
            mvMatrix = glMatrix.mat4.create()
            glMatrix.mat4.translate(mvMatrix, mvMatrix, [tile.x, tile.y, 0]);
            glMatrix.mat4.rotateX(mvMatrix, mvMatrix, tile.rotation*Math.PI)
            glMatrix.mat4.scale(mvMatrix, mvMatrix, [0.5, 0.5, 0.5]);            
            glMatrix.mat4.mul(mvMatrix, camera, mvMatrix);
            gl.bindBuffer(gl.ARRAY_BUFFER, MapTile.vxBackTc);
            gl.vertexAttribPointer(MapTile.programInfo.tPos, 2, gl.FLOAT, false, 0, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, MapTile.texTileBack);
            gl.uniform1i(MapTile.programInfo.tSampler, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, MapTile.vxBack);
            gl.vertexAttribPointer(MapTile.programInfo.vPos, 3, gl.FLOAT, false, 0, 0);
            gl.uniformMatrix4fv(MapTile.programInfo.mvMat, false, mvMatrix);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        });

    }

    constructor(x, y, tileNum) {
        this.x = x;
        this.y = y;
        this.tileNum = tileNum;
        this.rotation=0;
    }



}

