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
    }

    update() {
        if (this.isAnimating) {
            this.propellerAngle += 0.25;
        }

        if (this.autoRotate) {
            this.rotY += 0.015;
        }

        // Matriz Base do Helicóptero (Translação * Rotações * Escala)
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
        // Ordem de transformação no vértice: T(-pivô) -> R(θ) -> T(+pivô) -> baseTransform
        let mainPropTransform = m4.identity();
        mainPropTransform = m4.translate(mainPropTransform, -0.0, -0.35, -0.0);
        mainPropTransform = m4.yRotate(mainPropTransform, this.propellerAngle);
        mainPropTransform = m4.translate(mainPropTransform, 0.0, 0.35, 0.0);
        mainPropTransform = m4.multiply(baseTransform, mainPropTransform);
        this.helicopterPropellers.update(mainPropTransform);

        // Hélice da Cauda: pivô central em (0.7, 0.0, 0.06)
        // Ordem de transformação no vértice: T(-pivô) -> R(θ) -> T(+pivô) -> baseTransform
        let tailPropTransform = m4.identity();
        tailPropTransform = m4.translate(tailPropTransform, -0.7, -0.0, -0.06);
        tailPropTransform = m4.zRotate(tailPropTransform, this.propellerAngle * 2.0);
        tailPropTransform = m4.translate(tailPropTransform, 0.7, 0.0, 0.06);
        tailPropTransform = m4.multiply(baseTransform, tailPropTransform);
        this.helicopterTailPropeller.update(tailPropTransform);
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
