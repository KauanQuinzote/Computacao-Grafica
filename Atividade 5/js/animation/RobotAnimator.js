/**
 * RobotAnimator - Motor de Animação Procedural Cíclica.
 * Puro em relação ao DOM e ao WebGL.
 */
export class RobotAnimator {
    constructor() {
        this.isAnimating = false;
        this.animTime = 0;
    }

    toggle() {
        this.isAnimating = !this.isAnimating;
        return this.isAnimating;
    }

    update(dt) {
        if (!this.isAnimating) return null;

        this.animTime += dt * 3.5;

        // Cálculos trigonométricos da caminhada/aceno
        const swingArm = Math.sin(this.animTime) * 35;
        const swingLeg = Math.cos(this.animTime) * 25;
        const headBob = Math.sin(this.animTime * 2) * 8;

        return {
            rotShoulderL: Math.round(20 + swingArm),
            rotShoulderR: Math.round(-20 - swingArm),
            rotLegL: Math.round(swingLeg),
            rotLegR: Math.round(-swingLeg),
            rotHead: Math.round(headBob)
        };
    }
}
