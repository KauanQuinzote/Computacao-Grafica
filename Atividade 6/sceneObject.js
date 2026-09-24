class SceneObject {
    constructor(geometry) {
        this.vertices = geometry.vertices;
        this.colors = geometry.colors;
        this.indices = geometry.indices;
        this.modelTransform = m4.identity();
    }

    update(matrix) {
        this.modelTransform = matrix;
    }

    draw(renderer) {
        renderer.draw(this);
    }
}

class HelicopterBody extends SceneObject {
    constructor() {
        super(helicopterBodyGeometry);
    }
}

class HelicopterTopShaft extends SceneObject {
    constructor() {
        super(helicopterTopShaftGeometry);
    }
}

class HelicopterTail extends SceneObject {
    constructor() {
        super(helicopterTailGeometry);
    }
}

class HelicopterPropellers extends SceneObject {
    constructor() {
        super(helicopterPropellersGeometry);
    }
}

class HelicopterTailPropeller extends SceneObject {
    constructor() {
        super(helicopterTailPropellerGeometry);
    }
}

class MarkerGizmo extends SceneObject {
    constructor() {
        super(markerGeometry);
    }
}
