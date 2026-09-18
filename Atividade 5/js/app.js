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
            onToggleAnimate: () => this.toggleAnimate(),
            onViewModeChange: (mode) => this.robot.setViewMode(mode)
        });

        // Aplica os valores iniciais da UI no Robô
        this.applyPoseFromUI(this.ui.getValues());

        // Inicia o Loop de Renderização
        requestAnimationFrame((ts) => this.renderLoop(ts));
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

        // Animação Procedural
        const animState = this.animator.update(dt);
        if (animState) {
            const currentUI = this.ui.getValues();
            const merged = { ...currentUI, ...animState };
            this.ui.setValues(merged);
            this.applyPoseFromUI(merged);
            this.robot.animateTreads(dt);
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
