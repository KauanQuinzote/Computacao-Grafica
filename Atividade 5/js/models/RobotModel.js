import { Node2D } from '../scene/Node2D.js';

/**
 * Paleta de Cores Neon / RGBA para o Robô (11 cores ativas)
 */
export const COLORS = {
    AMBER: [1.0, 0.85, 0.0, 1.0],      // Amarelo Neon / Cabeça
    GREEN: [0.0, 0.9, 0.45, 1.0],      // Verde Neon / Status LED
    RED: [1.0, 0.25, 0.25, 1.0],       // Vermelho Neon / Status LED
    ORANGE: [1.0, 0.5, 0.0, 1.0],      // Laranja Neon / Boca
    WHITE: [1.0, 1.0, 1.0, 1.0],       // Branco / Brilho Especular
    BLACK: [0.05, 0.05, 0.08, 1.0],    // Preto / Pupila & Garras
    DARK_GRAY: [0.2, 0.2, 0.25, 1.0],  // Cinza Escuro / Pescoço & Corpo da Esteira
    CHARCOAL: [0.12, 0.14, 0.18, 1.0], // Metal Escuro / Braços, Garras e Olhos
    METALLIC: [0.6, 0.65, 0.7, 1.0],   // Metal Prata / Bisel & Roldanas
    LENS_BLUE: [0.1, 0.45, 0.85, 1.0], // Abertura Óptica Lente
    YELLOW: [1.0, 0.9, 0.1, 1.0]       // Amarelo / Tronco
};

/**
 * Mapeamento de Cores por Componente do Robô (WALL-E)
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
    LEG: COLORS.DARK_GRAY,
    TREAD_PAD: COLORS.BLACK,
    TREAD_WHEEL: COLORS.METALLIC,
    MOUTH: COLORS.ORANGE
};

/**
 * Constantes de Configuração, Proporções e Geometria das Partes do Robô
 */
export const ROBOT_CONFIG = {
    TORSO: {
        INITIAL_POS: [400, 250],
        SCALE: [90, 130]
    },
    CHEST_PANEL: {
        TRANSLATION: [-0.22, 0.22],
        SCALE: [0.48, 0.28],
        BUTTON_Y: 0.15,
        BUTTON_SCALE: [0.22, 0.55],
        BUTTON_X_OFFSETS: [-0.32, 0.0, 0.32]
    },
    HEAD: {
        NECK_TRANSLATION: [0, -0.45],
        NECK_SCALE: [0.16, 0.42],
        EYE_TUBE_X_OFFSET: 1.35,
        EYE_TUBE_Y: -0.4,
        EYE_TUBE_SCALE: [2.3, 1.3],
        LENS_TRANSLATION: [0, 0.15],
        LENS_SCALE: [0.85, 0.75],
        APERTURE_SCALE: [0.75, 0.75],
        PUPIL_SCALE: [0.55, 0.55],
        GLARE_TRANSLATION: [-0.25, -0.25],
        GLARE_SCALE: [0.3, 0.3]
    },
    ARMS: {
        SHOULDER_X_OFFSET: 0.52,
        SHOULDER_Y: 0.05,
        SHOULDER_SCALE: [0.18, 0.55],
        SHOULDER_RADIUS: 0.5,
        ELBOW_TRANSLATION: [0, 1.0],
        ELBOW_SCALE: [1.2, 0.75],
        ELBOW_RADIUS: 0.35,
        HAND_TRANSLATION: [0, 1.0],
        HAND_SCALE: [0.95, 0.25],
        HAND_RADIUS: 0.25,
        FINGER_Y: 0.8,
        FINGER_SCALE: [0.22, 0.65],
        FINGER_RADIUS: 0.5,
        FINGER_X_OFFSETS: [-0.36, 0.0, 0.36]
    },
    TREADS: {
        TRANSLATION_X_OFFSET: 0.42,
        TRANSLATION_Y: 0.85,
        SCALE: [0.52, 0.55],
        TOP_SCALE: 0.55,
        RADIUS: 0.35,
        WHEEL_DEFAULT_SIZE: 0.25,
        WHEEL_CIRCLE_RADIUS: 0.5,
        WHEELS: [
            { x: -0.32, y: 0.68, size: 0.28 },
            { x: 0.32, y: 0.68, size: 0.28 },
            { x: 0.0, y: 0.28, size: 0.22 }
        ],
        PAD_SCALE: [0.08, 0.16],
        PAD_RADIUS: 0.2,
        ROTATION_SPEED: 4.0
    }
};

/**
 * ButtonNode - Botão/LED do painel de controle do peito
 */
export class ButtonNode extends Node2D {
    constructor(name = 'button', color = COLORS.RED, posX = 0) {
        super(name, color);
        this.translation = [posX, ROBOT_CONFIG.CHEST_PANEL.BUTTON_Y];
        this.scale = ROBOT_CONFIG.CHEST_PANEL.BUTTON_SCALE;
    }
}

/**
 * ChestPanelNode - Painel de Controle de Carga/Status no peito do WALL-E
 */
export class ChestPanelNode extends Node2D {
    constructor(name = 'chestPanel') {
        super(name, PART_COLORS.NECK);
        this.translation = ROBOT_CONFIG.CHEST_PANEL.TRANSLATION;
        this.scale = ROBOT_CONFIG.CHEST_PANEL.SCALE;

        const [xLeft, xCenter, xRight] = ROBOT_CONFIG.CHEST_PANEL.BUTTON_X_OFFSETS;
        const btnRed = new ButtonNode(`${name}_red`, COLORS.RED, xLeft);
        btnRed.setParent(this);

        const btnAmber = new ButtonNode(`${name}_amber`, COLORS.AMBER, xCenter);
        btnAmber.setParent(this);

        const btnGreen = new ButtonNode(`${name}_green`, COLORS.GREEN, xRight);
        btnGreen.setParent(this);
    }
}

/**
 * TorsoNode - Tronco do Robô (Raiz)
 */
export class TorsoNode extends Node2D {
    constructor(name = 'torso') {
        super(name, PART_COLORS.TORSO);
        this.translation = ROBOT_CONFIG.TORSO.INITIAL_POS;
        this.scale = ROBOT_CONFIG.TORSO.SCALE;

        this.chestPanel = new ChestPanelNode('chestPanel');
        this.chestPanel.setParent(this);
    }
}

/**
 * SpecularGlareNode - Ponto de Brilho/Reflexo Especular da Lente
 */
export class SpecularGlareNode extends Node2D {
    constructor(name = 'glare') {
        super(name, PART_COLORS.GLARE);
        this.translation = ROBOT_CONFIG.HEAD.GLARE_TRANSLATION;
        this.scale = ROBOT_CONFIG.HEAD.GLARE_SCALE;
    }
}

/**
 * PupilNode - Pupila/Sensor Central da Lente
 */
export class PupilNode extends Node2D {
    constructor(name = 'pupil') {
        super(name, PART_COLORS.PUPIL);
        this.translation = [0, 0];
        this.scale = ROBOT_CONFIG.HEAD.PUPIL_SCALE;

        const glare = new SpecularGlareNode(`${name}_glare`);
        glare.setParent(this);
    }
}

/**
 * ApertureNode - Abertura Óptica da Lente
 */
export class ApertureNode extends Node2D {
    constructor(name = 'aperture') {
        super(name, PART_COLORS.APERTURE);
        this.translation = [0, 0];
        this.scale = ROBOT_CONFIG.HEAD.APERTURE_SCALE;

        const pupil = new PupilNode(`${name}_pupil`);
        pupil.setParent(this);
    }
}

/**
 * LensNode - Moldura e Bisel Metálico da Lente
 */
export class LensNode extends Node2D {
    constructor(name = 'lens') {
        super(name, PART_COLORS.LENS_BEZEL);
        this.translation = ROBOT_CONFIG.HEAD.LENS_TRANSLATION;
        this.scale = ROBOT_CONFIG.HEAD.LENS_SCALE;

        const aperture = new ApertureNode(`${name}_aperture`);
        aperture.setParent(this);
    }
}

/**
 * EyeTubeNode - Cilindro Ocular Binocular Estilo WALL-E
 */
export class EyeTubeNode extends Node2D {
    constructor(name = 'eyeTube', sideSign = -1) {
        super(name, PART_COLORS.EYE_TUBE);
        this.translation = [sideSign * ROBOT_CONFIG.HEAD.EYE_TUBE_X_OFFSET, ROBOT_CONFIG.HEAD.EYE_TUBE_Y];
        this.scale = ROBOT_CONFIG.HEAD.EYE_TUBE_SCALE;

        this.lens = new LensNode(`${name}_lens`);
        this.lens.setParent(this);
    }
}

/**
 * HeadNode - Haste do Pescoço conectando o Tronco diretamente aos Cilindros Oculares do WALL-E
 */
export class HeadNode extends Node2D {
    constructor(name = 'head') {
        super(name, PART_COLORS.NECK);
        this.translation = ROBOT_CONFIG.HEAD.NECK_TRANSLATION;
        this.scale = ROBOT_CONFIG.HEAD.NECK_SCALE;

        this.eyeTubeL = new EyeTubeNode('eyeL', -1);
        this.eyeTubeL.setParent(this);

        this.eyeTubeR = new EyeTubeNode('eyeR', 1);
        this.eyeTubeR.setParent(this);
    }
}

/**
 * ClawFingerNode - Garrinha individual mecânica (formato retangular com pontas arredondadas)
 */
export class ClawFingerNode extends Node2D {
    constructor(name = 'clawFinger', posX = 0) {
        super(name, PART_COLORS.CLAW);
        this.translation = [posX, ROBOT_CONFIG.ARMS.FINGER_Y];
        this.scale = ROBOT_CONFIG.ARMS.FINGER_SCALE;
        this.cornerRadius = ROBOT_CONFIG.ARMS.FINGER_RADIUS;
    }
}

/**
 * ClawHandNode - Base da mão com 3 garras articuladas (formato retangular com pontas arredondadas)
 */
export class ClawHandNode extends Node2D {
    constructor(name = 'clawHand') {
        super(name, PART_COLORS.CLAW);
        this.translation = ROBOT_CONFIG.ARMS.HAND_TRANSLATION;
        this.scale = ROBOT_CONFIG.ARMS.HAND_SCALE;
        this.cornerRadius = ROBOT_CONFIG.ARMS.HAND_RADIUS;

        const [xLeft, xCenter, xRight] = ROBOT_CONFIG.ARMS.FINGER_X_OFFSETS;
        const claw1 = new ClawFingerNode(`${name}_claw1`, xLeft);
        claw1.setParent(this);

        const claw2 = new ClawFingerNode(`${name}_claw2`, xCenter);
        claw2.setParent(this);

        const claw3 = new ClawFingerNode(`${name}_claw3`, xRight);
        claw3.setParent(this);
    }
}

/**
 * ArmNode - Braço Articulado Retangular com Pontas Arredondadas (WALL-E)
 */
export class ArmNode extends Node2D {
    constructor(side = 'L') {
        const sideSign = side === 'L' ? -1 : 1;
        super(`shoulder${side}`, PART_COLORS.SHOULDER);
        this.translation = [sideSign * ROBOT_CONFIG.ARMS.SHOULDER_X_OFFSET, ROBOT_CONFIG.ARMS.SHOULDER_Y];
        this.scale = ROBOT_CONFIG.ARMS.SHOULDER_SCALE;
        this.cornerRadius = ROBOT_CONFIG.ARMS.SHOULDER_RADIUS;

        this.elbow = new Node2D(`elbow${side}`, PART_COLORS.ELBOW);
        this.elbow.cornerRadius = ROBOT_CONFIG.ARMS.ELBOW_RADIUS;
        this.elbow.setParent(this);
        this.elbow.translation = ROBOT_CONFIG.ARMS.ELBOW_TRANSLATION;
        this.elbow.scale = ROBOT_CONFIG.ARMS.ELBOW_SCALE;

        this.hand = new ClawHandNode(`hand${side}`);
        this.hand.setParent(this.elbow);
    }
}

/**
 * TreadWheelNode - Roldana/Roda interna da esteira
 */
export class TreadWheelNode extends Node2D {
    constructor(name = 'wheel', posX = 0, posY = 0, size = ROBOT_CONFIG.TREADS.WHEEL_DEFAULT_SIZE) {
        super(name, PART_COLORS.TREAD_WHEEL);
        this.translation = [posX, posY];
        this.scale = [size, size];
        this.cornerRadius = ROBOT_CONFIG.TREADS.WHEEL_CIRCLE_RADIUS;
    }
}

/**
 * TreadPadNode - Retângulo/Garra individual da correia periférica
 */
export class TreadPadNode extends Node2D {
    constructor(name = 'pad', posX = 0, posY = 0, rot = 0) {
        super(name, PART_COLORS.TREAD_PAD);
        this.translation = [posX, posY];
        this.scale = ROBOT_CONFIG.TREADS.PAD_SCALE;
        this.rotation = rot;
        this.cornerRadius = ROBOT_CONFIG.TREADS.PAD_RADIUS;
    }
}

/**
 * LegNode - Esteira de Trator / Tanque em formato trapezoidal com pontas arredondadas (WALL-E)
 */
export class LegNode extends Node2D {
    constructor(side = 'L') {
        const sideSign = side === 'L' ? -1 : 1;
        super(`leg${side}`, PART_COLORS.LEG);
        this.translation = [sideSign * ROBOT_CONFIG.TREADS.TRANSLATION_X_OFFSET, ROBOT_CONFIG.TREADS.TRANSLATION_Y];
        this.scale = ROBOT_CONFIG.TREADS.SCALE;

        this.shapeType = 'trapezoid';
        this.topScale = ROBOT_CONFIG.TREADS.TOP_SCALE;
        this.cornerRadius = ROBOT_CONFIG.TREADS.RADIUS;

        // Roldanas metálicas internas da esteira
        this.wheels = ROBOT_CONFIG.TREADS.WHEELS.map((w, idx) => 
            new TreadWheelNode(`${side}_w${idx + 1}`, w.x, w.y, w.size)
        );
        this.wheels.forEach(w => w.setParent(this));

        // Garras/Retângulos da correia dispostos ao longo do perímetro da esteira
        this.pads = [];

        // 1. Base inferior (y = 0.98)
        const bottomXs = [-0.42, -0.25, -0.08, 0.08, 0.25, 0.42];
        bottomXs.forEach((x, i) => {
            const pad = new TreadPadNode(`${side}_padB${i}`, x, 0.98, Math.PI / 2);
            pad.setParent(this);
            this.pads.push(pad);
        });

        // 2. Lateral esquerda inclinada
        const leftPads = [
            { x: -0.46, y: 0.80, rot: -0.4 },
            { x: -0.38, y: 0.50, rot: -0.65 },
            { x: -0.28, y: 0.22, rot: -0.9 }
        ];
        leftPads.forEach((p, i) => {
            const pad = new TreadPadNode(`${side}_padL${i}`, p.x, p.y, p.rot);
            pad.setParent(this);
            this.pads.push(pad);
        });

        // 3. Topo (y = 0.02)
        const topXs = [-0.18, 0.0, 0.18];
        topXs.forEach((x, i) => {
            const pad = new TreadPadNode(`${side}_padT${i}`, x, 0.02, Math.PI / 2);
            pad.setParent(this);
            this.pads.push(pad);
        });

        // 4. Lateral direita inclinada
        const rightPads = [
            { x: 0.28, y: 0.22, rot: 0.9 },
            { x: 0.38, y: 0.50, rot: 0.65 },
            { x: 0.46, y: 0.80, rot: 0.4 }
        ];
        rightPads.forEach((p, i) => {
            const pad = new TreadPadNode(`${side}_padR${i}`, p.x, p.y, p.rot);
            pad.setParent(this);
            this.pads.push(pad);
        });
    }
}

/**
 * RobotModel - Encapsula a anatomia, proporções e articulações do Robô 2D.
 */
export class RobotModel {
    constructor() {
        this.nodes = {};
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

        // 4. Pernas / Esteiras (Esquerda e Direita instanciadas com coordenadas espelhadas)
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

    updateTreads(dt) {
        ['legL', 'legR'].forEach(legName => {
            const leg = this.nodes[legName];
            if (leg && leg.wheels) {
                leg.wheels.forEach(w => {
                    w.rotation += dt * ROBOT_CONFIG.TREADS.ROTATION_SPEED;
                });
            }
        });
    }

    setJointRotation(jointName, angleRad) {
        if (this.nodes[jointName]) {
            this.nodes[jointName].rotation = angleRad;
        }
    }
}
