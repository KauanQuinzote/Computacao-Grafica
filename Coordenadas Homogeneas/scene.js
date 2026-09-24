/**
 * Classe Scene: Gerenciador da visualização 3D, câmeras orbitais,
 * cálculo das etapas homogêneas e sincronização com a UI.
 */

class Scene {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        this.renderer = new Renderer(gl, program);

        // Geometrias Disponíveis
        this.models = {
            cube: createCubeGeometry(),
            pyramid: createPyramidGeometry(),
            prism: createPrismGeometry(),
            tetrahedron: createTetrahedronGeometry()
        };

        this.currentModelKey = 'cube';
        this.axesGeometry = createAxesGeometry();
        this.gridGeometry = createGridGeometry();
        this.gizmoGeometry = createGizmoMarkerGeometry();

        // Parâmetros de Transformação do Objeto (Espaço do Modelo)
        this.posX = 0.0;
        this.posY = 0.0;
        this.posZ = 0.0;
        this.rotX = 0.0;
        this.rotY = 0.0;
        this.rotZ = 0.0;
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.scaleZ = 1.0;

        // Controle da Pipeline / Decomposição Passo-a-Passo
        // 0: Identidade (Original), 1: Escala (S), 2: Rotações (R*S), 3: Translação (T*R*S = Final)
        this.currentStep = 3; 

        // Câmera Orbital 3D
        this.cameraDistance = 3.2;
        this.cameraYaw = 0.6;   // radianos ao redor de Y
        this.cameraPitch = 0.4; // radianos acima do plano XZ
        this.cameraTarget = [0, 0, 0];

        // Inspeção de Vértice / Coordenadas Homogêneas [x, y, z, h]
        this.selectedVertexIndex = 0;
        this.isCustomPoint = false;
        this.customPoint = [0.5, 0.5, 0.5, 1.0];

        // Animação Contínua
        this.autoRotateObject = false;
        this.autoRotateCamera = false;

        // Cache de Matrizes Calculadas
        this.matrices = {
            identity: m4.identity(),
            scale: m4.identity(),
            rotX: m4.identity(),
            rotY: m4.identity(),
            rotZ: m4.identity(),
            rotCombined: m4.identity(),
            translation: m4.identity(),
            finalModel: m4.identity(),
            stepMatrix: m4.identity(),
            inverseModel: m4.identity()
        };
    }

    setModel(key) {
        if (this.models[key]) {
            this.currentModelKey = key;
            this.selectedVertexIndex = 0;
            this.updateVertexSelectorOptions();
        }
    }

    setStep(stepIndex) {
        this.currentStep = Math.max(0, Math.min(3, stepIndex));
    }

    setCameraPreset(preset) {
        switch (preset) {
            case 'isometric':
                this.cameraYaw = Math.PI / 4;
                this.cameraPitch = Math.PI / 6;
                this.cameraDistance = 3.2;
                break;
            case 'front':
                this.cameraYaw = 0;
                this.cameraPitch = 0;
                this.cameraDistance = 3.0;
                break;
            case 'top':
                this.cameraYaw = 0;
                this.cameraPitch = Math.PI / 2 - 0.01;
                this.cameraDistance = 3.2;
                break;
            case 'side':
                this.cameraYaw = Math.PI / 2;
                this.cameraPitch = 0;
                this.cameraDistance = 3.0;
                break;
            case 'reset':
                this.cameraYaw = 0.6;
                this.cameraPitch = 0.4;
                this.cameraDistance = 3.2;
                this.posX = 0; this.posY = 0; this.posZ = 0;
                this.rotX = 0; this.rotY = 0; this.rotZ = 0;
                this.scaleX = 1; this.scaleY = 1; this.scaleZ = 1;
                this.currentStep = 3;
                break;
        }
    }

    update() {
        if (this.autoRotateObject) {
            this.rotY += 0.015;
            this.rotX += 0.008;
        }

        if (this.autoRotateCamera) {
            this.cameraYaw += 0.01;
        }

        // Matrizes Individuais Homogêneas
        const I = m4.identity();
        const S = m4.scaling(this.scaleX, this.scaleY, this.scaleZ);
        const Rx = m4.xRotation(this.rotX);
        const Ry = m4.yRotation(this.rotY);
        const Rz = m4.zRotation(this.rotZ);
        
        // Rotação Composta = Rx * Ry * Rz
        let R = m4.multiply(Rx, Ry);
        R = m4.multiply(R, Rz);

        const T = m4.translation(this.posX, this.posY, this.posZ);

        // Matriz Acumulada Passo-a-Passo:
        // Passo 0: I
        // Passo 1: S = S * I
        // Passo 2: R * S
        // Passo 3: T * R * S (Final)
        const step0 = I;
        const step1 = S;
        const step2 = m4.multiply(R, S);
        const step3 = m4.multiply(T, step2);

        this.matrices.identity = I;
        this.matrices.scale = S;
        this.matrices.rotX = Rx;
        this.matrices.rotY = Ry;
        this.matrices.rotZ = Rz;
        this.matrices.rotCombined = R;
        this.matrices.translation = T;
        this.matrices.finalModel = step3;
        this.matrices.inverseModel = m4.inverse(step3);

        // Escolhe a matriz do passo atual
        const stepMatrices = [step0, step1, step2, step3];
        this.matrices.stepMatrix = stepMatrices[this.currentStep];

        // Vetor Homogêneo Selecionado [x, y, z, h]
        const currentModel = this.models[this.currentModelKey];
        let baseVector = [0, 0, 0, 1];

        if (this.isCustomPoint) {
            baseVector = this.customPoint;
        } else if (currentModel.keyVertices && currentModel.keyVertices[this.selectedVertexIndex]) {
            baseVector = currentModel.keyVertices[this.selectedVertexIndex].point;
        }

        // Transformar no espaço homogêneo usando a matriz do passo ativo
        const transformedVector = m4.transformVector4(this.matrices.stepMatrix, baseVector);

        // Atualizar HUD da Matriz 4x4 e Vetor
        this.updateHUD(this.matrices.stepMatrix, baseVector, transformedVector);
    }

    draw() {
        const gl = this.gl;

        gl.clearColor(0.04, 0.06, 0.10, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        // Cálculo da Câmera LookAt
        const cy = Math.cos(this.cameraPitch);
        const camX = this.cameraTarget[0] + this.cameraDistance * cy * Math.sin(this.cameraYaw);
        const camY = this.cameraTarget[1] + this.cameraDistance * Math.sin(this.cameraPitch);
        const camZ = this.cameraTarget[2] + this.cameraDistance * cy * Math.cos(this.cameraYaw);

        const cameraMatrix = m4.lookAt([camX, camY, camZ], this.cameraTarget, [0, 1, 0]);
        const viewMatrix = m4.inverse(cameraMatrix);

        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projMatrix = m4.perspective(45 * Math.PI / 180, aspect, 0.1, 100);

        this.renderer.setCamera(viewMatrix, projMatrix);

        // 1. Renderizar Grid do Piso (com matriz identidade)
        this.renderer.drawMesh(this.gridGeometry, m4.identity());

        // 2. Renderizar Eixos Cartesianos 3D na Origem (X=Vermelho, Y=Verde, Z=Azul)
        this.renderer.drawMesh(this.axesGeometry, m4.identity());

        // 3. Renderizar o Objeto 3D Ativo com a Matriz do Passo Atual
        const activeModel = this.models[this.currentModelKey];
        this.renderer.drawMesh(activeModel, this.matrices.stepMatrix);

        // 4. Renderizar o Gizmo / Marcador Luminoso no Vértice Rastreado
        let baseVector = this.isCustomPoint ? this.customPoint : activeModel.keyVertices[this.selectedVertexIndex].point;
        const transformedVector = m4.transformVector4(this.matrices.stepMatrix, baseVector);

        const h = transformedVector[3] !== 0 ? transformedVector[3] : 1.0;
        const gizmoModelMatrix = m4.translation(
            transformedVector[0] / h,
            transformedVector[1] / h,
            transformedVector[2] / h
        );
        this.renderer.drawMesh(this.gizmoGeometry, gizmoModelMatrix);
    }

    updateHUD(matrix, inVec, outVec) {
        // Matriz 4x4 em formato column-major (WebGL):
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

        if (inX && !this.isCustomPoint) inX.textContent = Number(inVec[0]).toFixed(2);
        if (inY && !this.isCustomPoint) inY.textContent = Number(inVec[1]).toFixed(2);
        if (inZ && !this.isCustomPoint) inZ.textContent = Number(inVec[2]).toFixed(2);
        if (inH && !this.isCustomPoint) inH.textContent = Number(inVec[3]).toFixed(2);

        const outX = document.getElementById("valOutX");
        const outY = document.getElementById("valOutY");
        const outZ = document.getElementById("valOutZ");
        const outH = document.getElementById("valOutH");

        if (outX) outX.textContent = Number(outVec[0]).toFixed(2);
        if (outY) outY.textContent = Number(outVec[1]).toFixed(2);
        if (outZ) outZ.textContent = Number(outVec[2]).toFixed(2);
        if (outH) outH.textContent = Number(outVec[3]).toFixed(2);
    }

    updateVertexSelectorOptions() {
        const select = document.getElementById("vertexSelect");
        if (!select) return;

        select.innerHTML = "";
        const model = this.models[this.currentModelKey];
        if (model && model.keyVertices) {
            model.keyVertices.forEach((v, idx) => {
                const opt = document.createElement("option");
                opt.value = idx;
                opt.textContent = v.name;
                select.appendChild(opt);
            });
        }
        select.value = this.selectedVertexIndex;
    }

    execute() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.execute());
    }

    init() {
        this.updateVertexSelectorOptions();
        requestAnimationFrame(() => this.execute());
    }
}
