/**
 * Computação Gráfica - Atividade 5
 * Renderização de Robô Articulado 2D com Matrizes 3x3 e Grafo de Cena (Scene Graph)
 */

// ==========================================
// 1. CLASSE NODE2D (GRAFO DE CENA HIERÁRQUICO)
// ==========================================
class Node2D {
    constructor(name, color = [1.0, 1.0, 1.0, 1.0]) {
        this.name = name;
        this.color = color;

        // Transformações Locais
        this.translation = [0, 0];
        this.rotation = 0; // em radianos
        this.scale = [1, 1];

        // Matrizes 3x3
        this.localMatrix = m3.identity();
        this.worldMatrix = m3.identity();

        // Relações Hierárquicas
        this.parent = null;
        this.children = [];
    }

    setParent(parent) {
        if (this.parent) {
            const index = this.parent.children.indexOf(this);
            if (index >= 0) {
                this.parent.children.splice(index, 1);
            }
        }
        if (parent) {
            parent.children.push(this);
        }
        this.parent = parent;
    }

    updateWorldMatrix(parentWorldMatrix) {
        // Mlocal = Translation * Rotation * Scale
        let m = m3.translation(this.translation[0], this.translation[1]);
        m = m3.rotate(m, this.rotation);
        m = m3.scale(m, this.scale[0], this.scale[1]);
        this.localMatrix = m;

        // Mworld = MparentWorld * Mlocal
        if (parentWorldMatrix) {
            this.worldMatrix = m3.multiply(parentWorldMatrix, this.localMatrix);
        } else {
            this.worldMatrix = this.localMatrix;
        }

        // Atualiza recursivamente todos os nós filhos
        for (const child of this.children) {
            child.updateWorldMatrix(this.worldMatrix);
        }
    }

    draw(gl, programInfo, projectionMatrix) {
        // Mfinal = Mprojection * Mworld
        const finalMatrix = m3.multiply(projectionMatrix, this.worldMatrix);

        // Envia as uniforms para o Shader
        gl.uniformMatrix3fv(programInfo.uniforms.matrix, false, finalMatrix);
        gl.uniform4fv(programInfo.uniforms.color, this.color);

        // Renderiza o retângulo base (6 vértices)
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Desenha recursivamente os filhos
        for (const child of this.children) {
            child.draw(gl, programInfo, projectionMatrix);
        }
    }
}

// ==========================================
// 2. CLASSE PRINCIPAL DA APLICAÇÃO (ROBOT APP)
// ==========================================
class RobotApp {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.programInfo = null;

        // Nós do Grafo de Cena
        this.nodes = {};

        // Estado da Animação Automática
        this.isAnimating = false;
        this.animTime = 0;

        // Elementos da UI
        this.ui = {};
    }

    init() {
        this.canvas = document.getElementById('glCanvas');
        if (!this.canvas) return;

        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            alert('WebGL não suportado pelo navegador.');
            return;
        }

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Configuração dos Shaders e Buffers
        this.initShaders();
        this.initBuffers();

        // Construção do Robô (Grafo de Cena)
        this.buildRobot();

        // Conexão com Sliders e Botões da UI
        this.bindUI();

        // Inicia o Loop de Renderização
        requestAnimationFrame((ts) => this.renderLoop(ts));
    }

    initShaders() {
        const vsSource = `
            attribute vec2 a_position;
            uniform mat3 u_matrix;

            void main() {
                vec3 position = u_matrix * vec3(a_position, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
            }
        `;

        const fsSource = `
            precision mediump float;
            uniform vec4 u_color;

            void main() {
                gl_FragColor = u_color;
            }
        `;

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Erro de link do programa WebGL:', this.gl.getProgramInfoLog(program));
            return;
        }

        this.gl.useProgram(program);

        this.programInfo = {
            program: program,
            attribs: {
                position: this.gl.getAttribLocation(program, 'a_position')
            },
            uniforms: {
                matrix: this.gl.getUniformLocation(program, 'u_matrix'),
                color: this.gl.getUniformLocation(program, 'u_color')
            }
        };
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Erro de compilação no Shader:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    initBuffers() {
        // Geometria Retangular Unitária com Origem no Topo-Centro (0,0)
        // Permite rotações naturais em torno do pivô/junta!
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

        const positions = new Float32Array([
            -0.5, 0.0,
             0.5, 0.0,
            -0.5, 1.0,
            -0.5, 1.0,
             0.5, 0.0,
             0.5, 1.0,
        ]);

        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        this.gl.enableVertexAttribArray(this.programInfo.attribs.position);
        this.gl.vertexAttribPointer(this.programInfo.attribs.position, 2, this.gl.FLOAT, false, 0, 0);
    }

    buildRobot() {
        // 1. Tronco (Nó Raiz do Robô)
        const torso = new Node2D('torso', [0.0, 0.85, 1.0, 1.0]); // Ciano Neon
        torso.translation = [400, 250];
        torso.scale = [90, 130];

        // 2. Cabeça
        const head = new Node2D('head', [1.0, 0.85, 0.0, 1.0]); // Amarelo Neon
        head.setParent(torso);
        head.translation = [0, -0.45]; // Relativo ao topo do tronco
        head.scale = [0.65, 0.45];

        // 3. Braço Esquerdo (Ombro)
        const shoulderL = new Node2D('shoulderL', [1.0, 0.2, 0.6, 1.0]); // Magenta Neon
        shoulderL.setParent(torso);
        shoulderL.translation = [-0.52, 0.05];
        shoulderL.scale = [0.28, 0.55];

        // 4. Antebraço Esquerdo (Cotovelo)
        const elbowL = new Node2D('elbowL', [1.0, 0.4, 0.75, 1.0]);
        elbowL.setParent(shoulderL);
        elbowL.translation = [0, 1.0]; // Na ponta do ombro
        elbowL.scale = [0.85, 0.85];

        // 5. Braço Direito (Ombro)
        const shoulderR = new Node2D('shoulderR', [1.0, 0.2, 0.6, 1.0]);
        shoulderR.setParent(torso);
        shoulderR.translation = [0.52, 0.05];
        shoulderR.scale = [0.28, 0.55];

        // 6. Antebraço Direito (Cotovelo)
        const elbowR = new Node2D('elbowR', [1.0, 0.4, 0.75, 1.0]);
        elbowR.setParent(shoulderR);
        elbowR.translation = [0, 1.0];
        elbowR.scale = [0.85, 0.85];

        // 7. Perna Esquerda
        const legL = new Node2D('legL', [0.0, 0.9, 0.45, 1.0]); // Verde Neon
        legL.setParent(torso);
        legL.translation = [-0.28, 1.0];
        legL.scale = [0.32, 0.75];

        // 8. Perna Direita
        const legR = new Node2D('legR', [0.0, 0.9, 0.45, 1.0]);
        legR.setParent(torso);
        legR.translation = [0.28, 1.0];
        legR.scale = [0.32, 0.75];

        // Armazena referências aos nós
        this.nodes = { torso, head, shoulderL, elbowL, shoulderR, elbowR, legL, legR };
    }

    bindUI() {
        const sliderIds = [
            'posX', 'posY', 'rotTorso', 'rotHead',
            'rotShoulderL', 'rotElbowL', 'rotShoulderR', 'rotElbowR',
            'rotLegL', 'rotLegR'
        ];

        sliderIds.forEach(id => {
            const input = document.getElementById(id);
            const valDisplay = document.getElementById('val' + id.charAt(0).toUpperCase() + id.slice(1));
            this.ui[id] = { input, valDisplay };

            if (input) {
                input.addEventListener('input', () => {
                    this.updateRobotFromUI();
                    if (valDisplay) {
                        const unit = id.startsWith('pos') ? 'px' : '°';
                        valDisplay.textContent = `${input.value}${unit}`;
                    }
                });
            }
        });

        // Botão Reset Pose
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetPose());
        }

        // Botão Animação Automática
        const btnAnimate = document.getElementById('btnAnimate');
        if (btnAnimate) {
            btnAnimate.addEventListener('click', () => {
                this.isAnimating = !this.isAnimating;
                btnAnimate.classList.toggle('active', this.isAnimating);
                btnAnimate.style.borderColor = this.isAnimating ? '#00e5ff' : '';
            });
        }

        // Aplica os valores iniciais da UI no Robô
        this.updateRobotFromUI();
    }

    degToRad(deg) {
        return (deg * Math.PI) / 180.0;
    }

    updateRobotFromUI() {
        if (!this.nodes.torso) return;

        const getVal = (id) => parseFloat(this.ui[id]?.input?.value || 0);

        // Tronco
        this.nodes.torso.translation = [getVal('posX'), getVal('posY')];
        this.nodes.torso.rotation = this.degToRad(getVal('rotTorso'));

        // Cabeça
        this.nodes.head.rotation = this.degToRad(getVal('rotHead'));

        // Braço Esquerdo
        this.nodes.shoulderL.rotation = this.degToRad(getVal('rotShoulderL'));
        this.nodes.elbowL.rotation = this.degToRad(getVal('rotElbowL'));

        // Braço Direito
        this.nodes.shoulderR.rotation = this.degToRad(getVal('rotShoulderR'));
        this.nodes.elbowR.rotation = this.degToRad(getVal('rotElbowR'));

        // Pernas
        this.nodes.legL.rotation = this.degToRad(getVal('rotLegL'));
        this.nodes.legR.rotation = this.degToRad(getVal('rotLegR'));
    }

    resetPose() {
        const defaults = {
            posX: 400,
            posY: 250,
            rotTorso: 0,
            rotHead: 0,
            rotShoulderL: 20,
            rotElbowL: -30,
            rotShoulderR: -20,
            rotElbowR: 30,
            rotLegL: 0,
            rotLegR: 0
        };

        Object.keys(defaults).forEach(id => {
            if (this.ui[id]?.input) {
                this.ui[id].input.value = defaults[id];
                const unit = id.startsWith('pos') ? 'px' : '°';
                if (this.ui[id].valDisplay) {
                    this.ui[id].valDisplay.textContent = `${defaults[id]}${unit}`;
                }
            }
        });

        this.updateRobotFromUI();
    }

    updateAnimation(dt) {
        if (!this.isAnimating) return;

        this.animTime += dt * 3.5;

        // Movimento de caminhada/aceno cíclico via seno/cosseno
        const swingArm = Math.sin(this.animTime) * 35;
        const swingLeg = Math.cos(this.animTime) * 25;
        const headBob = Math.sin(this.animTime * 2) * 8;

        this.ui.rotShoulderL.input.value = Math.round(20 + swingArm);
        this.ui.rotShoulderR.input.value = Math.round(-20 - swingArm);
        this.ui.rotLegL.input.value = Math.round(swingLeg);
        this.ui.rotLegR.input.value = Math.round(-swingLeg);
        this.ui.rotHead.input.value = Math.round(headBob);

        // Atualiza os displays textuais da UI
        Object.keys(this.ui).forEach(id => {
            const input = this.ui[id]?.input;
            const valDisplay = this.ui[id]?.valDisplay;
            if (input && valDisplay) {
                const unit = id.startsWith('pos') ? 'px' : '°';
                valDisplay.textContent = `${input.value}${unit}`;
            }
        });

        this.updateRobotFromUI();
    }

    renderLoop(timestamp) {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const dt = (timestamp - this.lastTimestamp) / 1000.0;
        this.lastTimestamp = timestamp;

        // Atualiza animação procedural se ativada
        this.updateAnimation(dt);

        // Limpa o canvas WebGL
        this.gl.clearColor(0.024, 0.035, 0.055, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Matriz de Projeção 2D (Pixels 800x600 -> Clip Space -1 a 1)
        const projectionMatrix = m3.projection(this.canvas.width, this.canvas.height);

        // Atualiza todas as matrizes mundiais no Grafo de Cena
        this.nodes.torso.updateWorldMatrix(null);

        // Renderiza a hierarquia do Robô a partir da raiz (Tronco)
        this.nodes.torso.draw(this.gl, this.programInfo, projectionMatrix);

        requestAnimationFrame((ts) => this.renderLoop(ts));
    }
}

// Inicializa a aplicação ao carregar o documento
window.addEventListener('DOMContentLoaded', () => {
    const app = new RobotApp();
    app.init();
});