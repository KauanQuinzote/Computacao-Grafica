/**
 * Computação Gráfica - Atividade 2
 * Arquitetura Orientada a Objetos com Singleton e Padrão Strategy
 */

// ==========================================
// 1. PADRÃO STRATEGY (ESTRATÉGIAS DE DESENHO)
// ==========================================

/**
 * Classe Base de Estratégia de Desenho
 */
class DrawStrategy {
    handleClick(x, y, manager) {}
    render(manager) {}
    reset() {}
}

/**
 * Estratégia Concreta: Traçar Retas com Algoritmo de Bresenham
 */
class LineStrategy extends DrawStrategy {
    constructor() {
        super();
        this.p1 = null;
        this.p2 = null;
    }

    handleClick(x, y, manager) {
        if (!this.p1 || (this.p1 && this.p2)) {
            // Define o novo P1 e reseta P2 (apaga a reta anterior)
            this.p1 = { x, y };
            this.p2 = null;
        } else {
            // Segundo clique: completa a reta P1-P2
            this.p2 = { x, y };
        }
    }

    reset() {
        this.p1 = null;
        this.p2 = null;
    }

    render(manager) {
        // 1. Se P1 e P2 existem, desenha a linha de Bresenham
        if (this.p1 && this.p2) {
            manager.drawBresenhamLine(this.p1, this.p2, manager.currentColorRGBA);
            manager.drawPoints([this.p1, this.p2], manager.currentColorRGBA, 6.0);
        }
        // 2. Se P1 foi clicado e aguarda P2 (pré-visualização com o mouse)
        else if (this.p1 && !this.p2 && manager.isMouseInside) {
            manager.drawBresenhamLine(this.p1, manager.mousePos, manager.currentColorRGBA);
            manager.drawPoints([this.p1], manager.currentColorRGBA, 6.0);
        }
        // 3. Se P1 foi clicado mas o mouse saiu do canvas
        else if (this.p1 && !this.p2) {
            manager.drawPoints([this.p1], manager.currentColorRGBA, 6.0);
        }
    }
}

/**
 * Estratégia Concreta: Traçar Triângulos (Dado 3 pontos)
 */
class TriangleStrategy extends DrawStrategy {
    constructor() {
        super();
        this.p1 = null;
        this.p2 = null;
        this.p3 = null;
    }

    handleClick(x, y, manager) {
        if (!this.p1 || (this.p1 && this.p2 && this.p3)) {
            // Clique 1: Inicia um novo triângulo (apaga o anterior e define P1)
            this.p1 = { x, y };
            this.p2 = null;
            this.p3 = null;
        } else if (this.p1 && !this.p2) {
            // Clique 2: Define o segundo vértice P2
            this.p2 = { x, y };
        } else if (this.p1 && this.p2 && !this.p3) {
            // Clique 3: Define o terceiro vértice P3 e completa o triângulo
            this.p3 = { x, y };
        }
    }

    reset() {
        this.p1 = null;
        this.p2 = null;
        this.p3 = null;
    }

    render(manager) {
        // 1. Se P1, P2 e P3 estão definidos: desenha e preenche o triângulo via Vertex Shader (gl.TRIANGLES)
        if (this.p1 && this.p2 && this.p3) {
            manager.drawFilledTriangle(this.p1, this.p2, this.p3, manager.currentColorRGBA);
            manager.drawPoints([this.p1, this.p2, this.p3], manager.currentColorRGBA, 6.0);
        }
        // 2. Se P1 e P2 estão definidos e aguarda P3: pré-visualiza o triângulo preenchido até a posição do mouse
        else if (this.p1 && this.p2 && !this.p3 && manager.isMouseInside) {
            manager.drawFilledTriangle(this.p1, this.p2, manager.mousePos, manager.currentColorRGBA);
            manager.drawPoints([this.p1, this.p2], manager.currentColorRGBA, 6.0);
        }
        else if (this.p1 && this.p2 && !this.p3) {
            manager.drawBresenhamLine(this.p1, this.p2, manager.currentColorRGBA);
            manager.drawPoints([this.p1, this.p2], manager.currentColorRGBA, 6.0);
        }
        // 3. Se apenas P1 está definido: pré-visualiza a primeira aresta
        else if (this.p1 && !this.p2 && manager.isMouseInside) {
            manager.drawBresenhamLine(this.p1, manager.mousePos, manager.currentColorRGBA);
            manager.drawPoints([this.p1], manager.currentColorRGBA, 6.0);
        }
        else if (this.p1 && !this.p2) {
            manager.drawPoints([this.p1], manager.currentColorRGBA, 6.0);
        }
    }
}

// ==========================================
// 2. CLASSE SINGLETON CANVASMANAGER (CONTEXTO)
// ==========================================

class CanvasManager {
    static instance = null;

    constructor(canvasId = 'canvas') {
        if (CanvasManager.instance) {
            return CanvasManager.instance;
        }

        this.canvasId = canvasId;
        this.canvas = null;
        this.gl = null;
        this.programInfo = null;

        // Estado de Movimentação do Mouse
        this.mousePos = { x: 0, y: 0 };
        this.isMouseInside = false;

        // Estratégia de Desenho Ativa (Padrão: LineStrategy)
        this.currentStrategy = new LineStrategy();
        this.strategyName = 'Retas';

        // Espectro de 10 Cores (Teclas 0 a 9)
        this.COLOR_SPECTRUM = {
            '0': { name: 'Azul (Padrão)', rgba: [0.23, 0.51, 0.96, 1.0] },
            '1': { name: 'Vermelho', rgba: [0.94, 0.27, 0.27, 1.0] },
            '2': { name: 'Verde', rgba: [0.13, 0.77, 0.37, 1.0] },
            '3': { name: 'Amarelo', rgba: [0.92, 0.70, 0.03, 1.0] },
            '4': { name: 'Ciano', rgba: [0.02, 0.71, 0.83, 1.0] },
            '5': { name: 'Magenta', rgba: [0.85, 0.27, 0.94, 1.0] },
            '6': { name: 'Laranja', rgba: [0.98, 0.45, 0.09, 1.0] },
            '7': { name: 'Roxo', rgba: [0.66, 0.33, 0.97, 1.0] },
            '8': { name: 'Rosa', rgba: [0.93, 0.28, 0.60, 1.0] },
            '9': { name: 'Branco', rgba: [0.97, 0.98, 0.99, 1.0] }
        };

        this.currentColorKey = '0';
        this.currentColorRGBA = this.COLOR_SPECTRUM['0'].rgba;

        CanvasManager.instance = this;
    }

    static getInstance(canvasId = 'canvas') {
        if (!CanvasManager.instance) {
            CanvasManager.instance = new CanvasManager(canvasId);
        }
        return CanvasManager.instance;
    }

    /**
     * Alterna a estratégia de desenho ativa
     */
    setStrategy(strategy, name) {
        this.currentStrategy.reset();
        this.currentStrategy = strategy;
        this.strategyName = name;
        alert(`Modo de desenho alterado para: ${name}`);
        this.render();
    }

    init() {
        this.canvas = document.getElementById(this.canvasId);
        if (!this.canvas) return;

        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            alert('WebGL não é suportado.');
            return;
        }

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Inicializa Shaders
        this.initShaders();

        // Limpa a tela
        this.clearCanvas();

        // Inicializa com a linha padrão (0,0) a (0,0) azul
        this.drawDefaultInitialLine();

        // Registra os ouvintes de evento
        this.setupEventListeners();
    }

    initShaders() {
        const vsSource = `
            attribute vec2 a_position;
            uniform vec2 u_resolution;
            uniform float u_pointSize;

            void main() {
                vec2 zeroToOne = a_position / u_resolution;
                vec2 zeroToTwo = zeroToOne * 2.0;
                vec2 clipSpace = zeroToTwo - 1.0;
                gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
                gl_PointSize = u_pointSize;
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
            console.error('Erro ao linkar programa WebGL:', this.gl.getProgramInfoLog(program));
            return;
        }

        this.gl.useProgram(program);

        this.programInfo = {
            program: program,
            attribs: {
                position: this.gl.getAttribLocation(program, 'a_position')
            },
            uniforms: {
                resolution: this.gl.getUniformLocation(program, 'u_resolution'),
                color: this.gl.getUniformLocation(program, 'u_color'),
                pointSize: this.gl.getUniformLocation(program, 'u_pointSize')
            },
            positionBuffer: this.gl.createBuffer()
        };

        this.gl.uniform2f(this.programInfo.uniforms.resolution, this.canvas.width, this.canvas.height);
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Erro no Shader:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    /**
     * Limpa o canvas e reseta a estratégia ativa
     */
    clearCanvas() {
        if (!this.gl) return;
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        if (this.currentStrategy) {
            this.currentStrategy.reset();
        }
    }

    setColorByKey(key) {
        if (this.COLOR_SPECTRUM[key]) {
            this.currentColorKey = key;
            this.currentColorRGBA = this.COLOR_SPECTRUM[key].rgba;
            this.render();
        }
    }

    /**
     * Algoritmo de Linha de Bresenham
     */
    bresenhamLine(x1, y1, x2, y2) {
        x1 = Math.round(x1);
        y1 = Math.round(y1);
        x2 = Math.round(x2);
        y2 = Math.round(y2);

        const pts = [];
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        let currX = x1;
        let currY = y1;

        while (true) {
            pts.push({ x: currX, y: currY });
            if (currX === x2 && currY === y2) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                currX += sx;
            }
            if (e2 < dx) {
                err += dx;
                currY += sy;
            }
        }
        return pts;
    }

    /**
     * Renderiza pontos usando EXCLUSIVAMENTE gl.POINTS
     */
    drawPoints(pts, color = this.currentColorRGBA, pointSize = 6.0) {
        if (!pts || pts.length === 0) return;

        const { attribs, uniforms, positionBuffer } = this.programInfo;

        const data = new Float32Array(pts.length * 2);
        for (let i = 0; i < pts.length; i++) {
            data[i * 2] = pts[i].x;
            data[i * 2 + 1] = pts[i].y;
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STREAM_DRAW);

        this.gl.enableVertexAttribArray(attribs.position);
        this.gl.vertexAttribPointer(attribs.position, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.uniform4fv(uniforms.color, color);
        this.gl.uniform1f(uniforms.pointSize, pointSize);

        this.gl.drawArrays(this.gl.POINTS, 0, pts.length);
    }

    /**
     * Desenha uma reta via algoritmo de Bresenham
     */
    drawBresenhamLine(p1, p2, color = this.currentColorRGBA) {
        if (!p1 || !p2) return;
        const pixels = this.bresenhamLine(p1.x, p1.y, p2.x, p2.y);
        this.drawPoints(pixels, color, 2.0);
    }

    /**
     * Desenha as arestas de um triângulo via algoritmo de Bresenham
     */
    drawTriangle(p1, p2, p3, color = this.currentColorRGBA) {
        if (!p1 || !p2 || !p3) return;
        this.drawBresenhamLine(p1, p2, color);
        this.drawBresenhamLine(p2, p3, color);
        this.drawBresenhamLine(p3, p1, color);
    }

    /**
     * Desenha um triângulo preenchido via Vertex Shader usando WebGL gl.TRIANGLES
     */
    drawFilledTriangle(p1, p2, p3, color = this.currentColorRGBA) {
        if (!p1 || !p2 || !p3) return;

        const { attribs, uniforms, positionBuffer } = this.programInfo;

        const data = new Float32Array([
            p1.x, p1.y,
            p2.x, p2.y,
            p3.x, p3.y
        ]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STREAM_DRAW);

        this.gl.enableVertexAttribArray(attribs.position);
        this.gl.vertexAttribPointer(attribs.position, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.uniform4fv(uniforms.color, color);

        // Preenche o triângulo com a cor vigente através do Vertex Shader (gl.TRIANGLES)
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }

    /**
     * Linha padrão inicial (0,0) a (0,0) azul por padrão
     */
    drawDefaultInitialLine() {
        if (this.currentStrategy instanceof LineStrategy) {
            this.currentStrategy.p1 = { x: 0, y: 0 };
            this.currentStrategy.p2 = { x: 0, y: 0 };
            this.currentColorRGBA = this.COLOR_SPECTRUM['0'].rgba;
            this.render();
        }
    }

    /**
     * Renderização principal delegada à estratégia ativa
     */
    render() {
        if (!this.gl) return;

        // Limpa o canvas de preto
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Delega o desenho para a Estratégia Ativa
        if (this.currentStrategy) {
            this.currentStrategy.render(this);
        }

        // Desenha o indicador da posição do mouse
        if (this.isMouseInside) {
            this.drawPoints([this.mousePos], this.currentColorRGBA, 8.0);
        }
    }

    setupEventListeners() {
        // Movimento do mouse
        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = Math.round(event.clientX - rect.left);
            this.mousePos.y = Math.round(event.clientY - rect.top);
            this.isMouseInside = true;
            this.render();
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isMouseInside = false;
            this.render();
        });

        // Clique no canvas repassado para a estratégia ativa
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.round(event.clientX - rect.left);
            const y = Math.round(event.clientY - rect.top);

            if (this.currentStrategy) {
                this.currentStrategy.handleClick(x, y, this);
            }
            this.render();
        });

        // Eventos de teclado (Teclas 0-9, R/T para trocar estratégia, Delete para limpar)
        window.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();

            if (key >= '0' && key <= '9') {
                this.setColorByKey(key);
            } else if (key === 'r') {
                this.setStrategy(new LineStrategy(), 'Traçar Retas');
            } else if (key === 't') {
                this.setStrategy(new TriangleStrategy(), 'Traçar Triângulos');
            } else if (event.key === 'Delete' || event.key === 'Backspace') {
                this.clearCanvas();
                alert('Tela limpa (clearCanvas)');
                this.render();
            }
        });
    }
}

// Inicialização Singleton
window.addEventListener('DOMContentLoaded', () => {
    const manager = CanvasManager.getInstance('canvas');
    manager.init();
});
