import { Node2D } from '../scene/Node2D.js';

/**
 * Paleta de Cores Neon / RGBA para o Robô (mínimo de 10 cores chaveadas)
 */
export const COLORS = {
    CYAN: [0.0, 0.85, 1.0, 1.0], // Ciano Neon
    AMBER: [1.0, 0.85, 0.0, 1.0], // Amarelo Neon
    MAGENTA: [1.0, 0.2, 0.6, 1.0], // Magenta Neon
    PINK: [1.0, 0.4, 0.75, 1.0], // Rosa Neon
    GREEN: [0.0, 0.9, 0.45, 1.0], // Verde Neon
    RED: [1.0, 0.25, 0.25, 1.0], // Vermelho Neon
    BLUE: [0.2, 0.4, 1.0, 1.0], // Azul Neon
    PURPLE: [0.6, 0.2, 0.9, 1.0], // Roxo Neon
    ORANGE: [1.0, 0.5, 0.0, 1.0], // Laranja Neon
    WHITE: [1.0, 1.0, 1.0, 1.0], // Branco
    BLACK: [0.05, 0.05, 0.08, 1.0], // Preto / Vulcano
    DARK_GRAY: [0.2, 0.2, 0.25, 1.0], // Cinza Escuro
    CHARCOAL: [0.12, 0.14, 0.18, 1.0], // Metal Escuro dos Braços, Garras e Olhos
    METALLIC: [0.6, 0.65, 0.7, 1.0], // Metal Prata / Bisel
    LENS_BLUE: [0.1, 0.45, 0.85, 1.0],  // Abertura Óptica Lente
    YELLOW: [1.0, 0.9, 0.1, 1.0]  // Amarelo
};

/**
 * Mapeamento de Cores para as Partes do Robô estilo WALL-E
 */
export const PART_COLORS = {
    TORSO: COLORS.YELLOW,
    HEAD: COLORS.AMBER,
    NECK: COLORS.DARK_GRAY,
    EYE_TUBE: COLORS.CHARCOAL,
    LENS_BEZEL: COLORS.METALLIC,
    APERTURE: COLORS.LENS_BLUE,
    PUPIL: COLORS.BLACK,
    GLARE: COLORS.WHITE,
    SHOULDER: COLORS.CHARCOAL,
    ELBOW: COLORS.METALLIC,
    CLAW: COLORS.CHARCOAL,
    LEG: COLORS.CHARCOAL,
    MOUTH: COLORS.ORANGE
};


/**
 * TorsoNode - Tronco central do Robô (Nó Raiz do Corpo)
 */
export class TorsoNode extends Node2D {
    constructor(name = 'torso') {
        super(name, PART_COLORS.TORSO);
        this.translation = [400, 250];
        this.scale = [110, 130];
        this.cornerRadius = 0.15;

        // Placa Peitoral / Display Central
        const badge = new Node2D(`${name}_badge`, COLORS.CHARCOAL);
        badge.translation = [0, 0.25];
        badge.scale = [0.65, 0.45];
        badge.cornerRadius = 0.1;
        badge.setParent(this);

        const light = new Node2D(`${name}_light`, COLORS.CYAN);
        light.translation = [0, 0.35];
        light.scale = [0.3, 0.15];
        light.cornerRadius = 0.5;
        light.setParent(badge);
    }
}

/**
 * EyeTubeNode - Estrutura dos Olhos Binoculares (WALL-E) com Lente e Brilho
 */
export class EyeTubeNode extends Node2D {
    constructor(name, side = 'L') {
        const sideSign = side === 'L' ? -1 : 1;
        super(name, PART_COLORS.EYE_TUBE);
        this.translation = [sideSign * 0.85, -0.3];
        this.scale = [1.25, 0.85];
        this.cornerRadius = 0.45;

        // Moldura Metálica da Lente
        const bezel = new Node2D(`${name}_bezel`, PART_COLORS.LENS_BEZEL);
        bezel.translation = [0, 0.1];
        bezel.scale = [0.85, 0.85];
        bezel.cornerRadius = 0.5;
        bezel.setParent(this);

        // Lente Azul
        const aperture = new Node2D(`${name}_aperture`, PART_COLORS.APERTURE);
        aperture.translation = [0, 0.1];
        aperture.scale = [0.65, 0.65];
        aperture.cornerRadius = 0.5;
        aperture.setParent(bezel);

        // Pupila
        const pupil = new Node2D(`${name}_pupil`, PART_COLORS.PUPIL);
        pupil.translation = [0, 0.1];
        pupil.scale = [0.35, 0.35];
        pupil.cornerRadius = 0.5;
        pupil.setParent(aperture);

        // Brilho / Glare
        const glare = new Node2D(`${name}_glare`, PART_COLORS.GLARE);
        glare.translation = [-0.15, -0.15];
        glare.scale = [0.25, 0.25];
        glare.cornerRadius = 0.5;
        glare.setParent(pupil);
    }
}

/**
 * MouthNode - Indicador Óptico / Boca do Robô
 */
export class MouthNode extends Node2D {
    constructor(name = 'mouth') {
        super(name, PART_COLORS.MOUTH);
        this.translation = [0, 0.65];
        this.scale = [0.6, 0.12];
        this.cornerRadius = 0.2;
    }
}

/**
 * HeadNode - Cabeça e Pescoço Binocular do Robô
 */
export class HeadNode extends Node2D {
    constructor(name = 'head') {
        super(name, PART_COLORS.NECK);
        this.translation = [0, -0.22];
        this.scale = [0.18, 0.35];
        this.cornerRadius = 0.1;

        // Olhos Binoculares Esquerdo e Direito
        this.eyeTubeL = new EyeTubeNode(`${name}_eyeL`, 'L');
        this.eyeTubeL.setParent(this);

        this.eyeTubeR = new EyeTubeNode(`${name}_eyeR`, 'R');
        this.eyeTubeR.setParent(this);

        // Boca
        this.mouth = new MouthNode(`${name}_mouth`);
        this.mouth.setParent(this);
    }
}

/**
 * ClawNode - Garra com geometria retangular e pontas arredondadas
 */
export class ClawNode extends Node2D {
    constructor(name, clawSign = 1) {
        super(name, PART_COLORS.CLAW);
        this.translation = [clawSign * 0.28, 0.85];
        this.rotation = clawSign * 0.25;
        this.scale = [0.35, 0.55];
        this.cornerRadius = 0.35;
    }
}

/**
 * ElbowNode - Cotovelo e Antebraço com Garra
 */
export class ElbowNode extends Node2D {
    constructor(side = 'L') {
        super(`elbow${side}`, PART_COLORS.ELBOW);
        this.translation = [0, 0.9];
        this.scale = [0.85, 0.85];
        this.cornerRadius = 0.4;

        // Garras Esquerda e Direita da Mão
        this.clawL = new ClawNode(`${this.name}_clawL`, -1);
        this.clawL.setParent(this);

        this.clawR = new ClawNode(`${this.name}_clawR`, 1);
        this.clawR.setParent(this);
    }
}

/**
 * ArmNode - Braço / Ombro com geometria retangular e pontas arredondadas
 */
export class ArmNode extends Node2D {
    constructor(side = 'L') {
        const sideSign = side === 'L' ? -1 : 1;
        super(`shoulder${side}`, PART_COLORS.SHOULDER);
        this.translation = [sideSign * 0.52, 0.1];
        this.scale = [0.22, 0.5];
        this.cornerRadius = 0.4;

        // Cotovelo / Antebraço Articulado
        this.elbow = new ElbowNode(side);
        this.elbow.setParent(this);
    }
}

/**
 * TreadPadNode - Sapata retangular da correia da esteira
 */

export class TreadPadNode extends Node2D {
    constructor(name = 'treadPad') {
        super(name, COLORS.DARK_GRAY);
        this.scale = [0.15, 0.08];
        this.cornerRadius = 0.2;
    }
}

/**
 * TreadWheelNode - Roda/Engrenagem interna da esteira
 */
export class TreadWheelNode extends Node2D {
    constructor(name = 'treadWheel', radius = 0.3) {
        super(name, COLORS.METALLIC);
        this.scale = [radius, radius];
        this.cornerRadius = 0.5; // Círculo/Cilindro perfeito
    }
}

/**
 * LegNode - Perna em Esteira de Trator (Triângulo Escaleno/Trapezoidal com sapatas nas bordas)
 */
export class LegNode extends Node2D {
    constructor(side = 'L') {
        const sideSign = side === 'L' ? -1 : 1;
        super(`leg${side}`, PART_COLORS.LEG);
        this.translation = [sideSign * 0.32, 1.0];
        this.scale = [0.42, 0.75];
        this.cornerRadius = 0.3;
        this.shapeType = 'rect'; // Inicialmente visão frontal
        this.viewMode = 'front';
        this.treadPhase = 0;

        // Rodas Internas de Tração (Visíveis no perfil de alto / trapezoidal)
        this.wheelTop = new TreadWheelNode(`${this.name}_wTop`, 0.32);
        this.wheelTop.translation = [0, 0.18];
        this.wheelTop.visible = false;
        this.wheelTop.setParent(this);

        this.wheelBottomL = new TreadWheelNode(`${this.name}_wBotL`, 0.42);
        this.wheelBottomL.translation = [-0.28, 0.78];
        this.wheelBottomL.visible = false;
        this.wheelBottomL.setParent(this);

        this.wheelBottomR = new TreadWheelNode(`${this.name}_wBotR`, 0.42);
        this.wheelBottomR.translation = [0.28, 0.78];
        this.wheelBottomR.visible = false;
        this.wheelBottomR.setParent(this);

        // 8 Sapatas retangulares distribuídas nas bordas
        this.pads = [];
        for (let i = 0; i < 8; i++) {
            const pad = new TreadPadNode(`${this.name}_pad${i}`);
            pad.setParent(this);
            this.pads.push(pad);
        }
        this.updatePadsLayout();
    }

    setViewMode(mode) { // 'front' | 'top'
        this.viewMode = mode;
        if (mode === 'top') {
            this.shapeType = 'trapezoid';
            this.scale = [0.65, 0.75];
            this.wheelTop.visible = true;
            this.wheelBottomL.visible = true;
            this.wheelBottomR.visible = true;
        } else {
            this.shapeType = 'rect';
            this.scale = [0.42, 0.75];
            this.wheelTop.visible = false;
            this.wheelBottomL.visible = false;
            this.wheelBottomR.visible = false;
        }
        this.updatePadsLayout();
    }

    animateTread(dt) {
        this.treadPhase = (this.treadPhase + dt * 2.0) % (Math.PI * 2);
        this.updatePadsLayout();
    }

    updatePadsLayout() {
        const count = this.pads.length;
        for (let i = 0; i < count; i++) {
            const t = (i / count + this.treadPhase / (Math.PI * 2)) % 1.0;
            const pad = this.pads[i];

            if (this.viewMode === 'top') {
                // Perímetro do trapezóide (base menor topo, base maior embaixo)
                let px = 0, py = 0;
                if (t < 0.25) { // Topo
                    const u = t / 0.25;
                    px = -0.2 + u * 0.4;
                    py = -0.04;
                } else if (t < 0.5) { // Borda Direita
                    const u = (t - 0.25) / 0.25;
                    px = 0.2 + u * 0.3;
                    py = u * 1.0;
                } else if (t < 0.75) { // Base maior inferior
                    const u = (t - 0.5) / 0.25;
                    px = 0.5 - u * 1.0;
                    py = 1.04;
                } else { // Borda Esquerda
                    const u = (t - 0.75) / 0.25;
                    px = -0.5 + u * 0.3;
                    py = 1.0 - u * 1.0;
                }
                pad.translation = [px, py];
                pad.scale = [0.18, 0.09];
                pad.visible = true;
            } else {
                // Vista frontal: retângulos de sapatas nas bordas laterais
                let px = 0, py = 0;
                if (i % 2 === 0) {
                    px = -0.52;
                    py = (i / count) * 1.0;
                } else {
                    px = 0.52;
                    py = ((i - 1) / count) * 1.0;
                }
                pad.translation = [px, py];
                pad.scale = [0.12, 0.1];
                pad.visible = true;
            }
        }
    }
}

/**
 * RobotModel - Encapsula a anatomia, proporções e articulações do Robô 2D.
 */
export class RobotModel {
    constructor() {
        this.nodes = {};
        this.viewMode = 'front';
        this.buildHierarchy();
    }

    buildHierarchy() {
        // 1. Tronco (Nó Raiz do Robô)
        const torso = new TorsoNode('torso');

        // 2. Cabeça WALL-E (Haste do pescoço + 2 Cilindros Oculares Binoculares)
        const head = new HeadNode('head');
        head.setParent(torso);

        // 3. Braços (Esquerdo e Direito instanciados com coordenadas espelhadas)
        const armL = new ArmNode('L');
        armL.setParent(torso);

        const armR = new ArmNode('R');
        armR.setParent(torso);

        // 4. Pernas em Esteiras de Trator (Esquerda e Direita)
        const legL = new LegNode('L');
        legL.setParent(torso);

        const legR = new LegNode('R');
        legR.setParent(torso);

        // Mapa de nós para acesso direto e controle de articulações
        this.nodes = {
            torso,
            head,
            shoulderL: armL,
            elbowL: armL.elbow,
            shoulderR: armR,
            elbowR: armR.elbow,
            legL,
            legR,
            eyeL: head.eyeTubeL,
            eyeR: head.eyeTubeR
        };
    }

    getRoot() {
        return this.nodes.torso;
    }

    setPosition(x, y) {
        this.nodes.torso.translation = [x, y];
    }

    setJointRotation(jointName, angleRad) {
        if (this.nodes[jointName]) {
            this.nodes[jointName].rotation = angleRad;
        }
    }

    setViewMode(mode) {
        this.viewMode = mode;
        if (this.nodes.legL) this.nodes.legL.setViewMode(mode);
        if (this.nodes.legR) this.nodes.legR.setViewMode(mode);
    }

    animateTreads(dt) {
        if (this.nodes.legL) this.nodes.legL.animateTread(dt);
        if (this.nodes.legR) this.nodes.legR.animateTread(dt);
    }
}
