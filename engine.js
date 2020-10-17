import MapTile from "./MapTile.js";
import { } from "./gl-matrix-min.js";
export default class Engine {


    constructor(canvasId, logger) {
        this.logger = logger;
        this.canvas = document.querySelector("#" + canvasId);
        this.gl = this.canvas.getContext("webgl");

        if (this.gl === null) {
            alert("Error creating webGl context.");
            return;
        }

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    start() {
        this.camera = glMatrix.mat4.create();
        glMatrix.mat4.lookAt(this.camera, [4, 7, 2], [4, 0, 0], [0, 0, 1]);
        MapTile.init(this.gl, this.logger).then(_ => this.startLoop());
        this.canvas.addEventListener("keydown", evt => this.handleKeyDown(evt));
        this.canvas.addEventListener("keyup", evt => this.handleKeyUp(evt));
        this.generateTiles();
    }

    generateTiles() {
        let tileGrid = new Array(64);
        this.tiles = [new MapTile(0, 0, 0)];
        tileGrid[0] = this.tiles[0];
        let count = 1;
        while (count < 30) {
            let index=Math.floor(Math.random() * this.tiles.length);
            let currTile = this.tiles[index];
            let randomDir = Math.floor(Math.random() * 4);
            let currX = currTile.x;
            let currY = currTile.y;
            switch (randomDir) {
                case 0:
                    currX++;
                    break;
                case 1:
                    currX--;
                    break;
                case 2:
                    currY++;
                    break;
                case 3:
                    currY--;
                    break;
            }
            if(currX<0||currX>7||currY<0||currY>7) {
                continue;
            }
            let newIndex=currX%8+currY*8;
            if(tileGrid[newIndex]) {
                continue;
            }
            let newTile=new MapTile(currX, currY, Math.floor(Math.random()*25));
            this.tiles.push(newTile);
            tileGrid[newIndex]=newTile;
            count++;
        }
        
        this.tiles.forEach(t => t.rotation = 1);

    }

    startLoop() {
        window.setInterval(_ => this.handleFrame(), 1 / 30);
        this.lastFrame = new Date().getTime();
        this.cameraMovement = glMatrix.vec3.create();
        this.rotation = 0;
    }

    /**
     * @param {KeyboardEvent} evt 
     */
    handleKeyDown(evt) {
        console.log(evt);
        if (evt.repeat) {
            return;
        }

        let mult = evt.shiftKey ? 10 : 1;
        switch (evt.code) {
            case "KeyW":
            case "ArrowUp":
                this.cameraMovement[1] = mult;
                break;
            case "KeyS":
            case "ArrowDown":
                this.cameraMovement[1] = -mult;
                break;
            case "KeyA":
            case "ArrowLeft":
                this.cameraMovement[0] = -mult;
                break;
            case "KeyD":
            case "ArrowRight":
                this.cameraMovement[0] = +mult;
                break;
            case "PageUp":
                this.cameraMovement[2] = mult;
                break;
            case "PageDown":
                this.cameraMovement[2] = -mult;
                break;
            case "KeyQ":
                this.rotation = 1;
                break;
            case "KeyE":
                this.rotation = -1;
                break;
        }
    }

    /**
     * @param {KeyboardEvent} evt 
     */
    handleKeyUp(evt) {
        console.log(evt);
        if (evt.repeat) {
            return;
        }
        switch (evt.code) {
            case "KeyW":
            case "ArrowUp":
                this.cameraMovement[1] = 0;
                break;
            case "KeyS":
            case "ArrowDown":
                this.cameraMovement[1] = 0;
                break;
            case "KeyA":
            case "ArrowLeft":
                this.cameraMovement[0] = 0;
                break;
            case "KeyD":
            case "ArrowRight":
                this.cameraMovement[0] = 0;
                break;
            case "PageUp":
                this.cameraMovement[2] = 0;
                break;
            case "PageDown":
                this.cameraMovement[2] = 0;
                break;
            case "KeyQ":
                this.rotation = 0;
                break;
            case "KeyE":
                this.rotation = 0;
                break;
        }
    }

    handleFrame() {
        let now = new Date().getTime();
        let delta = now - this.lastFrame;

        let cameraTranslation = glMatrix.vec3.create();
        glMatrix.vec3.scale(cameraTranslation, this.cameraMovement, delta / 1000);
        if (glMatrix.vec3.length(cameraTranslation) > 0) {
            console.log(delta + " " + cameraTranslation);
        }
        glMatrix.mat4.translate(this.camera, this.camera, cameraTranslation);
        glMatrix.mat4.rotateZ(this.camera, this.camera, this.rotation * (Math.PI / 2) * delta / 1000);
        this.tiles.forEach(t => {
            t.rotation -= delta / 2000;
            if (t.rotation < 0) {
                t.rotation = 0;
            }
        })
        this.draw();
        this.lastFrame = now;

    }

    draw() {
        let gl = this.gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        let fieldOfView = 45 * Math.PI / 180;   // in radians
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let zNear = 0.1;
        let zFar = 100.0;
        let projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.perspective(projectionMatrix,
            fieldOfView,
            aspect,
            zNear,
            zFar);


        MapTile.draw(gl, this.tiles, this.camera, projectionMatrix);
    }
}