import { WebGLRenderer } from './renderer/WebGLRenderer.js';
import { RobotModel } from './models/RobotModel.js';
import { UIController } from './ui/UIController.js';
import { RobotAnimator } from './animation/RobotAnimator.js';

/**
 * Application - Orquestrador Principal da Aplicação.
 * Conecta os Módulos Profundos no loop de animação e eventos.
 */
class Application {
    constructor() {
        this.renderer = null;
        this.robot = null;
        this.ui = null;
        this.animator = null;
        this.lastTimestamp = 0;

        // Estado dos Controles de Teclado e Física de Pulo
        this.keys = {};
        this.isJumping = false;
        this.jumpVelY = 0;
        this.groundY = 250;
        this.gravity = 1400; // aceleração de gravidade em px/s²
        this.jumpImpulse = -550; // impulso de pulo em px/s
    }

    init() {
        const canvas = document.getElementById('glCanvas');
        if (!canvas) {
            console.error('Canvas WebGL não encontrado.');
            return;
        }

        // 1. Inicializa o Motor Gráfico
        this.renderer = new WebGLRenderer(canvas);

        // 2. Inicializa o Robô
        this.robot = new RobotModel();

        // 3. Inicializa o Motor de Animação
        this.animator = new RobotAnimator();

        // 4. Inicializa o Controlador de Interface
        this.ui = new UIController({
            onInputChange: (values) => this.applyPoseFromUI(values),
            onReset: () => this.resetPose(),
            onToggleAnimate: () => this.toggleAnimate()
        });

        // 5. Inicializa os Escutadores de Teclado
        this.initKeyboard();

        // Aplica os valores iniciais da UI no Robô
        this.applyPoseFromUI(this.ui.getValues());

        // Inicia o Loop de Renderização
        requestAnimationFrame((ts) => this.renderLoop(ts));
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key) || e.code === 'Space') {
                e.preventDefault();
            }
            this.keys[e.key] = true;
            this.keys[e.code] = true;

            // Disparo de Pulo com a Barra de Espaço
            if ((e.key === ' ' || e.code === 'Space') && !this.isJumping) {
                const currentY = this.ui ? this.ui.getValues().posY : 250;
                this.groundY = currentY;
                this.isJumping = true;
                this.jumpVelY = this.jumpImpulse;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.keys[e.code] = false;
        });
    }

    updateKeyboardAndPhysics(dt) {
        if (!this.ui || !this.robot) return;

        const vals = this.ui.getValues();
        let posX = vals.posX;
        let posY = vals.posY;
        let moved = false;
        const moveSpeed = 220; // Velocidade de movimento em px/s

        // 1. Teclas de Seta / WASD
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            posX -= moveSpeed * dt;
            moved = true;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            posX += moveSpeed * dt;
            moved = true;
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            if (!this.isJumping) posY -= moveSpeed * dt;
            moved = true;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            if (!this.isJumping) posY += moveSpeed * dt;
            moved = true;
        }

        // Limites da Tela (Canvas 800x600)
        posX = Math.max(100, Math.min(700, posX));

        // 2. Física de Pulo (Espaço)
        if (this.isJumping) {
            posY += this.jumpVelY * dt;
            this.jumpVelY += this.gravity * dt;

            // Pouso no Solo
            if (posY >= this.groundY) {
                posY = this.groundY;
                this.isJumping = false;
                this.jumpVelY = 0;
            }
            moved = true;
        } else {
            posY = Math.max(100, Math.min(500, posY));
        }

        // 3. Atualização de Posição e Animação das Esteiras
        if (moved) {
            const updated = { ...vals, posX: Math.round(posX), posY: Math.round(posY) };
            this.ui.setValues(updated);
            this.applyPoseFromUI(updated);
            this.robot.updateTreads(dt * 2.0);
        }
    }

    degToRad(deg) {
        return (deg * Math.PI) / 180.0;
    }

    applyPoseFromUI(v) {
        if (!this.robot) return;

        this.robot.setPosition(v.posX, v.posY);
        this.robot.setJointRotation('torso', this.degToRad(v.rotTorso));
        this.robot.setJointRotation('head', this.degToRad(v.rotHead));
        this.robot.setJointRotation('shoulderL', this.degToRad(v.rotShoulderL));
        this.robot.setJointRotation('elbowL', this.degToRad(v.rotElbowL));
        this.robot.setJointRotation('shoulderR', this.degToRad(v.rotShoulderR));
        this.robot.setJointRotation('elbowR', this.degToRad(v.rotElbowR));
        this.robot.setJointRotation('legL', this.degToRad(v.rotLegL));
        this.robot.setJointRotation('legR', this.degToRad(v.rotLegR));
    }

    resetPose() {
        const defaultPose = {
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

        this.isJumping = false;
        this.jumpVelY = 0;
        this.groundY = 250;
        this.ui.setValues(defaultPose);
        this.applyPoseFromUI(defaultPose);
    }

    toggleAnimate() {
        const isAnimating = this.animator.toggle();
        this.ui.setAnimateState(isAnimating);
    }

    renderLoop(timestamp) {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const dt = (timestamp - this.lastTimestamp) / 1000.0;
        this.lastTimestamp = timestamp;

        // Atualização de Teclado e Física de Pulo
        this.updateKeyboardAndPhysics(dt);

        // Animação Procedural Automática
        const animState = this.animator.update(dt);
        if (animState) {
            const currentUI = this.ui.getValues();
            const merged = { ...currentUI, ...animState };
            this.ui.setValues(merged);
            this.applyPoseFromUI(merged);
            this.robot.updateTreads(dt);
        }

        // Renderização WebGL do Grafo do Robô
        this.renderer.renderTree(this.robot.getRoot());

        requestAnimationFrame((ts) => this.renderLoop(ts));
    }
}

// Inicialização automatizada quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    app.init();
});
