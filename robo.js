
const canvasrobo = document.getElementById("robo");
const glrobo = canvasrobo.getContext("webgl2");

if (!glrobo) {
    throw new Error("Não foi possível obter o contexto de WebGL");
}

const roboVertices = [
    -0.5, 0.5,
    -0.5, -0.5,
    0.5, 0.5,
    0.5, -0.5
];

function getCircle(cx, cy, radius, numSegments) {
    const verticesrobo = [cx, cy];

    for (let i = 0; i <= numSegments; i++) {
        const angle = (i / numSegments) * 2 * Math.PI;
        verticesrobo.push(cx + radius * Math.cos(angle));
        verticesrobo.push(cy + radius * Math.sin(angle));
    }
    return verticesrobo;
}

const roboArray = new Float32Array(roboVertices);
const bufferrobo = glrobo.createBuffer();
glrobo.bindBuffer(glrobo.ARRAY_BUFFER, bufferrobo);
glrobo.bufferData(glrobo.ARRAY_BUFFER, roboArray, glrobo.STATIC_DRAW);

const vertexShaderSourcerobo = `#version 300 es
        in vec2 aPosition;

        void main() {
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `;


const fragmentShaderSourcerobo = `#version 300 es
    precision mediump float;

    uniform vec4 uColor;
    out vec4 outColor;

    void main() {
        outColor = uColor;
    }
    `;

function createShaderrobo(glrobo, source, type) {
    const shader = glrobo.createShader(type);
    glrobo.shaderSource(shader, source);
    glrobo.compileShader(shader);

    if (!glrobo.getShaderParameter(shader, glrobo.COMPILE_STATUS)) {
        const error = glrobo.getShaderInfoLog(shader);
        glrobo.deleteShader(shader);
        throw new Error("Não compilou o shader" + error);
    }

    return shader;
}

const vertexShaderrobo = createShaderrobo(
    glrobo,
    vertexShaderSourcerobo,
    glrobo.VERTEX_SHADER
);

const fragmentShaderrobo = createShaderrobo(
    glrobo,
    fragmentShaderSourcerobo,
    glrobo.FRAGMENT_SHADER
);

const programrobo = glrobo.createProgram();
glrobo.attachShader(programrobo, vertexShaderrobo);
glrobo.attachShader(programrobo, fragmentShaderrobo);
glrobo.linkProgram(programrobo);

if (!glrobo.getProgramParameter(programrobo, glrobo.LINK_STATUS)) {
    console.error(glrobo.getProgramInfoLog(programrobo));
    glrobo.deleteProgram(programrobo);
}

glrobo.useProgram(programrobo);

const positionAttributeLocationrobo = glrobo.getAttribLocation(programrobo, "aPosition");
const colorUniformLocationrobo = glrobo.getUniformLocation(programrobo, "uColor");

glrobo.enableVertexAttribArray(positionAttributeLocationrobo);

// Corpo
glrobo.uniform4f(colorUniformLocationrobo, 0.8, 0.5, 0.2, 1.0);
glrobo.bindBuffer(glrobo.ARRAY_BUFFER, bufferrobo);
glrobo.vertexAttribPointer(positionAttributeLocationrobo, 2, glrobo.FLOAT, false, 0, 0);
glrobo.drawArrays(glrobo.TRIANGLE_STRIP, 0, 4);

// Olho Esquerdo
glrobo.uniform4f(colorUniformLocationrobo, 0.0, 0.0, 0.0, 1.0);
const olhoEsquerdoVertices = getCircle(-0.2, 0.2, 0.08, 30);
const bufferOlhoEsquerdo = glrobo.createBuffer();
glrobo.bindBuffer(glrobo.ARRAY_BUFFER, bufferOlhoEsquerdo);
glrobo.bufferData(glrobo.ARRAY_BUFFER, new Float32Array(olhoEsquerdoVertices), glrobo.STATIC_DRAW);
glrobo.vertexAttribPointer(positionAttributeLocationrobo, 2, glrobo.FLOAT, false, 0, 0);
glrobo.drawArrays(glrobo.TRIANGLE_FAN, 0, olhoEsquerdoVertices.length / 2);

// Olho Direito
glrobo.uniform4f(colorUniformLocationrobo, 0.0, 0.0, 0.0, 1.0);
const olhoDireitoVertices = getCircle(0.2, 0.2, 0.08, 30);
const bufferOlhoDireito = glrobo.createBuffer();
glrobo.bindBuffer(glrobo.ARRAY_BUFFER, bufferOlhoDireito);
glrobo.bufferData(glrobo.ARRAY_BUFFER, new Float32Array(olhoDireitoVertices), glrobo.STATIC_DRAW);
glrobo.vertexAttribPointer(positionAttributeLocationrobo, 2, glrobo.FLOAT, false, 0, 0);
glrobo.drawArrays(glrobo.TRIANGLE_FAN, 0, olhoDireitoVertices.length / 2);

// Antena 1
glrobo.uniform4f(colorUniformLocationrobo, 1.0, 0.0, 0.0, 1.0);
const antena1Vertices = getCircle(-0.15, 0.5, 0.02, 20);
const bufferAntena1 = glrobo.createBuffer();
glrobo.bindBuffer(glrobo.ARRAY_BUFFER, bufferAntena1);
glrobo.bufferData(glrobo.ARRAY_BUFFER, new Float32Array(antena1Vertices), glrobo.STATIC_DRAW);
glrobo.vertexAttribPointer(positionAttributeLocationrobo, 2, glrobo.FLOAT, false, 0, 0);
glrobo.drawArrays(glrobo.TRIANGLE_FAN, 0, antena1Vertices.length / 2);

// Antena 2
glrobo.uniform4f(colorUniformLocationrobo, 1.0, 0.0, 0.0, 1.0);
const antena2Vertices = getCircle(0.15, 0.5, 0.02, 20);
const bufferAntena2 = glrobo.createBuffer();
glrobo.bindBuffer(glrobo.ARRAY_BUFFER, bufferAntena2);
glrobo.bufferData(glrobo.ARRAY_BUFFER, new Float32Array(antena2Vertices), glrobo.STATIC_DRAW);
glrobo.vertexAttribPointer(positionAttributeLocationrobo, 2, glrobo.FLOAT, false, 0, 0);
glrobo.drawArrays(glrobo.TRIANGLE_FAN, 0, antena2Vertices.length / 2);
