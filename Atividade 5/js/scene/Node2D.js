import { m3 } from '../math/m3.js';

/**
 * Node2D - Classe de Nó do Grafo de Cena 2D
 * Totalmente desacoplada da API do WebGL/DOM.
 */
export class Node2D {
    constructor(name, color = [1.0, 1.0, 1.0, 1.0]) {
        this.name = name;
        this.color = color;

        // Transformações Locais
        this.translation = [0, 0];
        this.rotation = 0; // em radianos
        this.scale = [1, 1];

        // Estilo Geométrico (0.0 = Retângulo com cantos vivos, 0.5 = Cápsula / Pontas Arredondadas)
        this.cornerRadius = 0.0;
        this.shapeType = 'rect'; // 'rect' ou 'trapezoid'
        this.topScale = 1.0; // Proporção da base superior para formato trapezoidal/triangular (ex: 0.55)

        // Matrizes de Transformação
        this.localMatrix = m3.identity();
        this.worldMatrix = m3.identity();

        // Estrutura Hierárquica
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

    updateWorldMatrix(parentWorldMatrix = null) {
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

        // Propaga para os filhos
        for (const child of this.children) {
            child.updateWorldMatrix(this.worldMatrix);
        }
    }
}
