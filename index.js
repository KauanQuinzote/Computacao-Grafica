
const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("Não foi possível obter o contexto de WebGL");
}

const vertices = new Float32Array([
    0.0, 0.5,
    -0.5, -0.5,
    0.5, -0.5
]);

const buffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const vertexShaderSource = `#version 300 es
        in vec2 aPosition;

        void main() {
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `;


const fragmentShaderSource = `#version 300 es

    precision mediump float;

    out vec4 outColor;

    void main() {
        outColor = vec4(1.0, 0.0, 0.0, 1.0);
    }

    `;

function createShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("Não compilou o shader" + error);

    }

    return shader;
}

const vertexShader = createShader(
    gl,
    vertexShaderSource,
    gl.VERTEX_SHADER
);

const fragmentShader = createShader(
    gl,
    fragmentShaderSource,
    gl.FRAGMENT_SHADER
);
const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

gl.enableVertexAttribArray(positionLocation);

gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
);

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);

gl.useProgram(program);

gl.drawArrays(
    gl.TRIANGLES,
    0,
    3
);


