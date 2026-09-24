// ==================================================
// CLASS - SCENE
// ==================================================

class Scene {

    constructor(gl, program) {
        this.gl = gl;
        this.program = program;

        this.renderer = new Renderer(gl, program);

        // Partes do Helicóptero
        this.helicopterBody = new HelicopterBody();
        this.helicopterTopShaft = new HelicopterTopShaft();
        this.helicopterTail = new HelicopterTail();
        this.helicopterPropellers = new HelicopterPropellers();
        this.helicopterTailPropeller = new HelicopterTailPropeller();

        // Marcador 3D para o Ponto Homogêneo Rastreado
        this.markerGizmo = new MarkerGizmo();

        // Parâmetros de Transformação e Animação
        this.rotX = 0.3;
        this.rotY = 0.5;
        this.rotZ = 0.0;
        this.posX = 0.0;
        this.posY = 0.0;
        this.posZ = 0.0;
        this.scaleVal = 0.7;

        this.propellerAngle = 0.0;
        this.isAnimating = true;
        this.autoRotate = false;

        // Inspeção de Matrizes e Espaço Homogêneo [x,y,z,h]
        this.matrixMode = 'global'; // 'global', 'translation', 'rotX', 'rotY', 'rotZ', 'scale', 'mainProp', 'tailProp'
        this.trackedVertex = [0.0, 0.0, 0.20, 1.0]; // Ponto de referência padrão (frente do corpo)
        this.customPoint = [0.0, 0.0, 0.20, 1.0];
        this.isCustomPoint = false;

        // Armazenamento das matrizes calculadas
        this.matrices = {
            global: m4.identity(),
            translation: m4.identity(),
            rotX: m4.identity(),
            rotY: m4.identity(),
            rotZ: m4.identity(),
            scale: m4.identity(),
            mainProp: m4.identity(),
            tailProp: m4.identity()
        };
    }

    update() {
        if (this.isAnimating) {
            this.propellerAngle += 0.25;
        }

        if (this.autoRotate) {
            this.rotY += 0.015;
        }

        // Matrizes Isoladas
        const matT = m4.translation(this.posX, this.posY, this.posZ);
        const matRx = m4.xRotation(this.rotX);
        const matRy = m4.yRotation(this.rotY);
        const matRz = m4.zRotation(this.rotZ);
        const matS = m4.scaling(this.scaleVal, this.scaleVal, this.scaleVal);

        // Matriz Base do Helicóptero (T * Rx * Ry * Rz * S)
        let baseTransform = m4.identity();
        baseTransform = m4.translate(baseTransform, this.posX, this.posY, this.posZ);
        baseTransform = m4.xRotate(baseTransform, this.rotX);
        baseTransform = m4.yRotate(baseTransform, this.rotY);
        baseTransform = m4.zRotate(baseTransform, this.rotZ);
        baseTransform = m4.scale(baseTransform, this.scaleVal, this.scaleVal, this.scaleVal);

        // Corpo, Haste superior e Cauda seguem a base
        this.helicopterBody.update(baseTransform);
        this.helicopterTopShaft.update(baseTransform);
        this.helicopterTail.update(baseTransform);

        // Hélice Principal: pivô central em (0, 0.35, 0)
        let mainPropTransform = m4.identity();
        mainPropTransform = m4.translate(mainPropTransform, -0.0, -0.35, -0.0);
        mainPropTransform = m4.yRotate(mainPropTransform, this.propellerAngle);
        mainPropTransform = m4.translate(mainPropTransform, 0.0, 0.35, 0.0);
        const fullMainPropTransform = m4.multiply(baseTransform, mainPropTransform);
        this.helicopterPropellers.update(fullMainPropTransform);

        // Hélice da Cauda: pivô central em (0.7, 0.0, 0.06)
        let tailPropTransform = m4.identity();
        tailPropTransform = m4.translate(tailPropTransform, -0.7, -0.0, -0.06);
        tailPropTransform = m4.zRotate(tailPropTransform, this.propellerAngle * 2.0);
        tailPropTransform = m4.translate(tailPropTransform, 0.7, 0.0, 0.06);
        const fullTailPropTransform = m4.multiply(baseTransform, tailPropTransform);
        this.helicopterTailPropeller.update(fullTailPropTransform);

        // Armazenar matrizes para o inspetor
        this.matrices.global = baseTransform;
        this.matrices.translation = matT;
        this.matrices.rotX = matRx;
        this.matrices.rotY = matRy;
        this.matrices.rotZ = matRz;
        this.matrices.scale = matS;
        this.matrices.mainProp = fullMainPropTransform;
        this.matrices.tailProp = fullTailPropTransform;

        // Cálculo de Coordenadas Homogêneas [x, y, z, h]
        const currentMatrix = this.matrices[this.matrixMode] || this.matrices.global;
        const inputVec = this.isCustomPoint ? this.customPoint : this.trackedVertex;
        const transformedVec = m4.transformVector4(currentMatrix, inputVec);

        // Posicionar o marcador 3D exatamente na posição transformada do vértice
        // Se h != 0, normalizamos para visualização cartesiana (x/h, y/h, z/h)
        const hNorm = transformedVec[3] !== 0 ? transformedVec[3] : 1.0;
        const markerPos = m4.translation(
            transformedVec[0] / hNorm,
            transformedVec[1] / hNorm,
            transformedVec[2] / hNorm
        );
        this.markerGizmo.update(markerPos);

        // Atualizar o HUD na tela
        this.updateMatrixHUD(currentMatrix, inputVec, transformedVec);
    }

    updateMatrixHUD(matrix, inputVec, outputVec) {
        // Matriz no formato column-major (WebGL):
        // m[0] = m00, m[4] = m01, m[8]  = m02, m[12] = m03 (tx)
        // m[1] = m10, m[5] = m11, m[9]  = m12, m[13] = m13 (ty)
        // m[2] = m20, m[6] = m21, m[10] = m22, m[14] = m23 (tz)
        // m[3] = m30, m[7] = m31, m[11] = m32, m[15] = m33 (1)

        const rows = [
            [matrix[0], matrix[4], matrix[8],  matrix[12]],
            [matrix[1], matrix[5], matrix[9],  matrix[13]],
            [matrix[2], matrix[6], matrix[10], matrix[14]],
            [matrix[3], matrix[7], matrix[11], matrix[15]]
        ];

        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const cell = document.getElementById(`m${r}${c}`);
                if (cell) {
                    cell.textContent = Number(rows[r][c]).toFixed(2);
                }
            }
        }

        // Vetores de Entrada e Saída
        const inX = document.getElementById("valInX");
        const inY = document.getElementById("valInY");
        const inZ = document.getElementById("valInZ");
        const inH = document.getElementById("valInH");

        if (inX && !this.isCustomPoint) inX.textContent = Number(inputVec[0]).toFixed(2);
        if (inY && !this.isCustomPoint) inY.textContent = Number(inputVec[1]).toFixed(2);
        if (inZ && !this.isCustomPoint) inZ.textContent = Number(inputVec[2]).toFixed(2);
        if (inH && !this.isCustomPoint) inH.textContent = Number(inputVec[3]).toFixed(2);

        const outX = document.getElementById("valOutX");
        const outY = document.getElementById("valOutY");
        const outZ = document.getElementById("valOutZ");
        const outH = document.getElementById("valOutH");

        if (outX) outX.textContent = Number(outputVec[0]).toFixed(2);
        if (outY) outY.textContent = Number(outputVec[1]).toFixed(2);
        if (outZ) outZ.textContent = Number(outputVec[2]).toFixed(2);
        if (outH) outH.textContent = Number(outputVec[3]).toFixed(2);
    }

    draw() {
        const gl = this.gl;

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        gl.useProgram(this.program);

        this.helicopterBody.draw(this.renderer);
        this.helicopterTopShaft.draw(this.renderer);
        this.helicopterTail.draw(this.renderer);
        this.helicopterPropellers.draw(this.renderer);
        this.helicopterTailPropeller.draw(this.renderer);

        // Renderizar Gizmo/Marcador do Vértice Homogêneo
        this.markerGizmo.draw(this.renderer);
    }

    execute() {
        this.update();
        this.draw();

        requestAnimationFrame(() => this.execute());
    }

    init() {
        requestAnimationFrame(() => this.execute());
    }
}
