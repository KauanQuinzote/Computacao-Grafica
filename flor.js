
const canvasFlor = document.getElementById("flor");
const glFlor = canvasFlor.getContext("webgl2");

if (!glFlor) {
    throw new Error("Não foi possível obter o contexto de WebGL");
}

function getCircle(cx, cy, radius, numSegments) {
    const verticesFlor = [cx, cy];

    for (let i = 0; i <= numSegments; i++) {
        const angle = (i / numSegments) * 2 * Math.PI;
        verticesFlor.push(cx + radius * Math.cos(angle));
        verticesFlor.push(cy + radius * Math.sin(angle));
    }
    return verticesFlor;
}
const segNumFlor = 50;
const flowerVertices = []
const petalsNumber = 5;
const radius = 0.1;
const petalsRadius = 0.2;
const distancePetals = 0.3;

flowerVertices.push(...getCircle(0, 0, radius, segNumFlor));

for (let i = 0; i < petalsNumber; i++) {
    const angle = (i / petalsNumber) * 2 * Math.PI;
    const cx = distancePetals * Math.cos(angle);
    const cy = distancePetals * Math.sin(angle);

    const petalVertices = getCircle(cx, cy, petalsRadius, segNumFlor);
    flowerVertices.push(...petalVertices);

}


const flowerArray = new Float32Array(flowerVertices);


const bufferFlor = glFlor.createBuffer();

glFlor.bindBuffer(glFlor.ARRAY_BUFFER, bufferFlor);

glFlor.bufferData(glFlor.ARRAY_BUFFER, flowerArray, glFlor.STATIC_DRAW);

const vertexShaderSourceFlor = `#version 300 es
        in vec2 aPosition;

        void main() {
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `;


const fragmentShaderSourceFlor = `#version 300 es

    precision mediump float;

    out vec4 outColor;

    void main() {
        outColor = vec4(1.0, 0.0, 0.0, 1.0);
    }

    `;

function createShaderFlor(glFlor, source, type) {
    const shader = glFlor.createShader(type);
    glFlor.shaderSource(shader, source);
    glFlor.compileShader(shader);

    if (!glFlor.getShaderParameter(shader, glFlor.COMPILE_STATUS)) {
        const error = glFlor.getShaderInfoLog(shader);
        glFlor.deleteShader(shader);
        throw new Error("Não compilou o shader" + error);

    }

    return shader;
}

const vertexShaderFlor = createShaderFlor(
    glFlor,
    vertexShaderSourceFlor,
    glFlor.VERTEX_SHADER
);

const fragmentShaderFlor = createShaderFlor(
    glFlor,
    fragmentShaderSourceFlor,
    glFlor.FRAGMENT_SHADER
);
const programFlor = glFlor.createProgram();

glFlor.attachShader(programFlor, vertexShaderFlor);
glFlor.attachShader(programFlor, fragmentShaderFlor);

glFlor.linkProgram(programFlor);

if (!glFlor.getProgramParameter(programFlor, glFlor.LINK_STATUS)) {

    throw new Error(
        glFlor.getProgramInfoLog(programFlor)
    );
}

const positionLocationFlor =
    glFlor.getAttribLocation(
        programFlor,
        "aPosition"
    );

glFlor.bindBuffer(glFlor.ARRAY_BUFFER, bufferFlor);

glFlor.enableVertexAttribArray(positionLocationFlor);

glFlor.vertexAttribPointer(
    positionLocationFlor,
    2,
    glFlor.FLOAT,
    false,
    0,
    0
);

glFlor.clearColor(0.1, 0.1, 0.1, 1.0);

glFlor.clear(glFlor.COLOR_BUFFER_BIT);

glFlor.useProgram(programFlor);

const pontosPorCirculo = segNumFlor + 2;
const totalCirculos = 1 + petalsNumber; // 1 miolo + 5 pétalas = 6
for (let i = 0; i < totalCirculos; i++) {
    const deslocamento = i * pontosPorCirculo;
    glFlor.drawArrays(
        glFlor.TRIANGLE_FAN,
        deslocamento,
        pontosPorCirculo
    );
}


