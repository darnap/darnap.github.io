attribute vec4 aVertexPosition;
attribute vec2 aTexPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTexCoord;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTexCoord=aTexPosition;
}