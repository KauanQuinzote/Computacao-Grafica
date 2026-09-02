
const canvasCarro = document.getElementById("carro");
const glCarro = canvasCarro.getContext("webgl2");

if (!glCarro) {
    throw new Error("Não foi possível obter o contexto de WebGL");
}

const carroVertices = [
    -0.5, 0.5,
    -0.5, 0.0,
    0.5, 0.5,
    0.5, 0.0
];

function getCircle(cx, cy, radius, numSegments) {
    const verticesCarro = [cx, cy];

    for (let i = 0; i <= numSegments; i++) {
        const angle = (i / numSegments) * 2 * Math.PI;
        verticesCarro.push(cx + radius * Math.cos(angle));
        verticesCarro.push(cy + radius * Math.sin(angle));
    }
    return verticesCarro;
}

const carroArray = new Float32Array(carroVertices);
const bufferCarro = glCarro.createBuffer();
glCarro.bindBuffer(glCarro.ARRAY_BUFFER, bufferCarro);
glCarro.bufferData(glCarro.ARRAY_BUFFER, carroArray, glCarro.STATIC_DRAW);

const vertexShaderSourceCarro = `#version 300 es
        in vec2 aPosition;

        void main() {
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `;


const fragmentShaderSourceCarro = `#version 300 es

    precision mediump float;

    out vec4 outColor;

    void main() {
        outColor = vec4(0.8, 0.7, 0.9, 1.0);
    }

    `;

function createShaderCarro(glCarro, source, type) {
    const shader = glCarro.createShader(type);
    glCarro.shaderSource(shader, source);
    glCarro.compileShader(shader);

    if (!glCarro.getShaderParameter(shader, glCarro.COMPILE_STATUS)) {
        const error = glCarro.getShaderInfoLog(shader);
        glCarro.deleteShader(shader);
        throw new Error("Não compilou o shader" + error);
    }

    return shader;
}

const vertexShaderCarro = createShaderCarro(
    glCarro,
    vertexShaderSourceCarro,
    glCarro.VERTEX_SHADER
);

const fragmentShaderCarro = createShaderCarro(
    glCarro,
    fragmentShaderSourceCarro,
    glCarro.FRAGMENT_SHADER
);

const programCarro = glCarro.createProgram();
glCarro.attachShader(programCarro, vertexShaderCarro);
glCarro.attachShader(programCarro, fragmentShaderCarro);
glCarro.linkProgram(programCarro);

if (!glCarro.getProgramParameter(programCarro, glCarro.LINK_STATUS)) {
    console.error(glCarro.getProgramInfoLog(programCarro));
    glCarro.deleteProgram(programCarro);
}

glCarro.useProgram(programCarro);

const positionAttributeLocationCarro = glCarro.getAttribLocation(programCarro, "aPosition");
glCarro.enableVertexAttribArray(positionAttributeLocationCarro);

glCarro.bindBuffer(glCarro.ARRAY_BUFFER, bufferCarro);
glCarro.vertexAttribPointer(positionAttributeLocationCarro, 2, glCarro.FLOAT, false, 0, 0);
glCarro.drawArrays(glCarro.TRIANGLE_STRIP, 0, 4);

const rodaEsquerdaVertices = getCircle(-0.25, 0.0, 0.1, 30);
const bufferRoda1 = glCarro.createBuffer();
glCarro.bindBuffer(glCarro.ARRAY_BUFFER, bufferRoda1);
glCarro.bufferData(glCarro.ARRAY_BUFFER, new Float32Array(rodaEsquerdaVertices), glCarro.STATIC_DRAW);
glCarro.vertexAttribPointer(positionAttributeLocationCarro, 2, glCarro.FLOAT, false, 0, 0);
glCarro.drawArrays(glCarro.TRIANGLE_FAN, 0, rodaEsquerdaVertices.length / 2);

const rodaDireitaVertices = getCircle(0.25, 0.0, 0.1, 30);
const bufferRoda2 = glCarro.createBuffer();
glCarro.bindBuffer(glCarro.ARRAY_BUFFER, bufferRoda2);
glCarro.bufferData(glCarro.ARRAY_BUFFER, new Float32Array(rodaDireitaVertices), glCarro.STATIC_DRAW);
glCarro.vertexAttribPointer(positionAttributeLocationCarro, 2, glCarro.FLOAT, false, 0, 0);
glCarro.drawArrays(glCarro.TRIANGLE_FAN, 0, rodaDireitaVertices.length / 2);