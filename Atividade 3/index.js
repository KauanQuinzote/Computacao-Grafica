/**
 * Computação Gráfica - Atividade 3
 * Animação e Jogo de Ping Pong WebGL 2D
 * Arquitetura POO com Singleton (GameEngine), Entidades (Paddle, Ball) e Sistema de Teclado Fluido
 */

// ==========================================
// 1. CLASSE PADDLE (ENTIDADE RAQUETE)
// ==========================================
class Paddle {
    constructor(x, y, width = 16, height = 120, color = [0.0, 0.95, 1.0, 1.0]) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 500.0; // píxeis por segundo
        this.color = color;
    }

    reset(y) {
        this.y = y;
    }

    moveUp(dt, minY = 0) {
        this.y = Math.max(minY, this.y - this.speed * dt);
    }

    moveDown(dt, maxY = 800) {
        this.y = Math.min(maxY - this.height, this.y + this.speed * dt);
    }

    getBoundingBox() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    render(engine) {
        engine.drawRect(this.x, this.y, this.width, this.height, this.color);
    }
}

// ==========================================
// 2. CLASSE BALL (ENTIDADE BOLA)
// ==========================================
class Ball {
    constructor(x, y, size = 16, color = [1.0, 0.9, 0.0, 1.0]) {
        this.initialX = x;
        this.initialY = y;
        this.x = x;
        this.y = y;
        this.size = size; // tamanho do quadrado/diâmetro da bola
        this.color = color;
        
        this.baseSpeed = 380.0; // velocidade base em px/s
        this.vx = 0;
        this.vy = 0;
        
        this.reset(1);
    }

    reset(direction = 1) {
        this.x = this.initialX;
        this.y = this.initialY;
        
        // Ângulo aleatório inicial (-30 a 30 graus)
        const angle = (Math.random() * 60 - 30) * (Math.PI / 180);
        this.vx = direction * this.baseSpeed * Math.cos(angle);
        this.vy = this.baseSpeed * Math.sin(angle);
    }

    getBoundingBox() {
        return {
            left: this.x - this.size / 2,
            right: this.x + this.size / 2,
            top: this.y - this.size / 2,
            bottom: this.y + this.size / 2
        };
    }

    update(dt, p1, p2, boundsWidth, boundsHeight, speedMultiplier, onScore) {
        const effectiveSpeed = speedMultiplier;
        
        // Atualiza posição com base na velocidade e fator do slider
        this.x += this.vx * effectiveSpeed * dt;
        this.y += this.vy * effectiveSpeed * dt;

        const halfSize = this.size / 2;

        // 1. Colisão com paredes superior e inferior
        if (this.y - halfSize <= 0) {
            this.y = halfSize;
            this.vy = Math.abs(this.vy);
        } else if (this.y + halfSize >= boundsHeight) {
            this.y = boundsHeight - halfSize;
            this.vy = -Math.abs(this.vy);
        }

        // 2. Colisão com Raquete 1 (Esquerda)
        const boxP1 = p1.getBoundingBox();
        if (
            this.x - halfSize <= boxP1.right &&
            this.x + halfSize >= boxP1.left &&
            this.y + halfSize >= boxP1.top &&
            this.y - halfSize <= boxP1.bottom &&
            this.vx < 0
        ) {
            this.x = boxP1.right + halfSize;
            
            // Calcula o ponto relativo de impacto na raquete (-1 no topo, +1 embaixo)
            const relativeImpact = (this.y - (p1.y + p1.height / 2)) / (p1.height / 2);
            const bounceAngle = relativeImpact * (Math.PI / 4); // até 45 graus
            const currentSpeed = Math.hypot(this.vx, this.vy) * 1.03; // leve aceleração no rebate

            this.vx = currentSpeed * Math.cos(bounceAngle);
            this.vy = currentSpeed * Math.sin(bounceAngle);
        }

        // 3. Colisão com Raquete 2 (Direita)
        const boxP2 = p2.getBoundingBox();
        if (
            this.x + halfSize >= boxP2.left &&
            this.x - halfSize <= boxP2.right &&
            this.y + halfSize >= boxP2.top &&
            this.y - halfSize <= boxP2.bottom &&
            this.vx > 0
        ) {
            this.x = boxP2.left - halfSize;
            
            const relativeImpact = (this.y - (p2.y + p2.height / 2)) / (p2.height / 2);
            const bounceAngle = relativeImpact * (Math.PI / 4);
            const currentSpeed = Math.hypot(this.vx, this.vy) * 1.03;

            this.vx = -currentSpeed * Math.cos(bounceAngle);
            this.vy = currentSpeed * Math.sin(bounceAngle);
        }

        // 4. Verificação de Pontuação (Bola passou das laterais)
        if (this.x + halfSize < 0) {
            // Ponto para Jogador 2
            onScore('P2');
            this.reset(1); // bola vai em direção ao P2
        } else if (this.x - halfSize > boundsWidth) {
            // Ponto para Jogador 1
            onScore('P1');
            this.reset(-1); // bola vai em direção ao P1
        }
    }

    render(engine) {
        const halfSize = this.size / 2;
        engine.drawRect(this.x - halfSize, this.y - halfSize, this.size, this.size, this.color);
    }
}

// ==========================================
// 3. CLASSE SINGLETON GAMEENGINE (MOTOR PRINCIPAL)
// ==========================================
class GameEngine {
    static instance = null;

    constructor(canvasId = 'glCanvas') {
        if (GameEngine.instance) {
            return GameEngine.instance;
        }

        this.canvasId = canvasId;
        this.canvas = null;
        this.gl = null;
        this.programInfo = null;

        // Dimensões Virtuais do Campo
        this.width = 800;
        this.height = 800;

        // Estados de Jogo
        this.STATE = {
            PRONTO: 'PRONTO',
            EM_JOGO: 'EM_JOGO',
            PAUSADO: 'PAUSADO',
            GAMEOVER: 'GAMEOVER'
        };
        this.currentState = this.STATE.PRONTO;

        // Entidades
        const paddleMargin = 30;
        const paddleWidth = 16;
        const paddleHeight = 120;
        const centerY = (this.height - paddleHeight) / 2;

        this.player1 = new Paddle(paddleMargin, centerY, paddleWidth, paddleHeight, [0.0, 0.95, 1.0, 1.0]); // Ciano Neon
        this.player2 = new Paddle(this.width - paddleMargin - paddleWidth, centerY, paddleWidth, paddleHeight, [1.0, 0.0, 0.5, 1.0]); // Magenta Neon
        this.ball = new Ball(this.width / 2, this.height / 2, 16, [1.0, 0.9, 0.0, 1.0]); // Amarelo Neon

        // Placar
        this.scoreP1 = 0;
        this.scoreP2 = 0;
        this.maxScore = 10;

        // Configurações e Teclado
        this.speedMultiplier = 1.0;
        this.keysPressed = new Set();
        this.lastTimeStamp = 0;

        GameEngine.instance = this;
    }

    static getInstance(canvasId = 'glCanvas') {
        if (!GameEngine.instance) {
            GameEngine.instance = new GameEngine(canvasId);
        }
        return GameEngine.instance;
    }

    init() {
        this.canvas = document.getElementById(this.canvasId);
        if (!this.canvas) return;

        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            alert('WebGL não é suportado no seu navegador.');
            return;
        }

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Inicializa Shaders WebGL
        this.initShaders();

        // Conecta Elementos da Interface (DOM)
        this.bindUI();

        // Registra Eventos de Teclado
        this.setupKeyboardListeners();

        // Exibe overlay inicial
        this.showOverlay('PING PONG WEBGL', 'Pressione ESPAÇO para iniciar a partida');

        // Inicia o Loop Principal com requestAnimationFrame
        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    initShaders() {
        const vsSource = `
            attribute vec2 a_position;
            uniform vec2 u_resolution;

            void main() {
                // Converte de coordenadas em píxeis (0..800) para clipspace (-1..1)
                vec2 zeroToOne = a_position / u_resolution;
                vec2 zeroToTwo = zeroToOne * 2.0;
                vec2 clipSpace = zeroToTwo - 1.0;
                // Inverte o eixo Y para que Y=0 fique no topo (sistema de coordenadas web)
                gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
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
                color: this.gl.getUniformLocation(program, 'u_color')
            },
            positionBuffer: this.gl.createBuffer()
        };

        this.gl.uniform2f(this.programInfo.uniforms.resolution, this.width, this.height);
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Erro de Compilação no Shader:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    drawRect(x, y, width, height, color) {
        const { attribs, uniforms, positionBuffer } = this.programInfo;

        const x1 = x;
        const x2 = x + width;
        const y1 = y;
        const y2 = y + height;

        const data = new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2
        ]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);

        this.gl.enableVertexAttribArray(attribs.position);
        this.gl.vertexAttribPointer(attribs.position, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.uniform4fv(uniforms.color, color);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    drawDashedCenterLine() {
        const dashWidth = 4;
        const dashHeight = 16;
        const gap = 12;
        const x = (this.width - dashWidth) / 2;
        const color = [1.0, 1.0, 1.0, 0.25]; // Branco translúcido

        for (let y = 10; y < this.height; y += dashHeight + gap) {
            this.drawRect(x, y, dashWidth, dashHeight, color);
        }
    }

    bindUI() {
        // Slider de velocidade
        const speedSlider = document.getElementById('speedSlider');
        const speedValueText = document.getElementById('speedValueText');

        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.speedMultiplier = parseFloat(e.target.value);
                if (speedValueText) {
                    speedValueText.textContent = `${this.speedMultiplier.toFixed(1)}x`;
                }
            });
        }

        // Botão de Reiniciar
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetGame());
        }

        // Botão Overlay
        const btnOverlayAction = document.getElementById('btnOverlayAction');
        if (btnOverlayAction) {
            btnOverlayAction.addEventListener('click', () => this.togglePause());
        }
    }

    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            const key = e.key;

            // Previne rolagem de página com setas ou espaço
            if (['Space', 'ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S', 'r', 'R'].includes(key) || e.code === 'Space') {
                if (document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                }
            }

            this.keysPressed.add(key.toLowerCase());
            this.keysPressed.add(e.code);

            // Tecla Espaço: Pausar/Iniciar
            if (e.code === 'Space') {
                this.togglePause();
            }

            // Tecla R: Reiniciar
            if (key.toLowerCase() === 'r') {
                this.resetGame();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keysPressed.delete(e.key.toLowerCase());
            this.keysPressed.delete(e.code);
        });
    }

    togglePause() {
        if (this.currentState === this.STATE.PRONTO || this.currentState === this.STATE.PAUSADO) {
            this.currentState = this.STATE.EM_JOGO;
            this.hideOverlay();
            this.updateStatusBadge('EM JOGO', 'playing');
        } else if (this.currentState === this.STATE.EM_JOGO) {
            this.currentState = this.STATE.PAUSADO;
            this.showOverlay('PARTIDA PAUSADA', 'Pressione ESPAÇO para retomar');
            this.updateStatusBadge('PAUSADO', 'paused');
        } else if (this.currentState === this.STATE.GAMEOVER) {
            this.resetGame();
            this.currentState = this.STATE.EM_JOGO;
            this.hideOverlay();
            this.updateStatusBadge('EM JOGO', 'playing');
        }
    }

    resetGame() {
        this.scoreP1 = 0;
        this.scoreP2 = 0;
        this.updateScoreBoard();

        const centerY = (this.height - this.player1.height) / 2;
        this.player1.reset(centerY);
        this.player2.reset(centerY);
        this.ball.reset(1);

        if (this.currentState === this.STATE.GAMEOVER) {
            this.currentState = this.STATE.PRONTO;
            this.showOverlay('NOVA PARTIDA', 'Pressione ESPAÇO para iniciar');
            this.updateStatusBadge('PRONTO', 'ready');
        }
    }

    handleScore(player) {
        if (player === 'P1') {
            this.scoreP1++;
        } else if (player === 'P2') {
            this.scoreP2++;
        }
        this.updateScoreBoard();

        // Checa condição de vitória (10 pontos)
        if (this.scoreP1 >= this.maxScore) {
            this.triggerGameOver('JOGADOR 1 VENCEU!');
        } else if (this.scoreP2 >= this.maxScore) {
            this.triggerGameOver('JOGADOR 2 VENCEU!');
        }
    }

    triggerGameOver(winnerMessage) {
        this.currentState = this.STATE.GAMEOVER;
        this.showOverlay(winnerMessage, 'Pressione R ou ESPAÇO para jogar novamente');
        this.updateStatusBadge('FIM DE JOGO', 'gameover');
    }

    updateScoreBoard() {
        const elP1 = document.getElementById('scoreP1');
        const elP2 = document.getElementById('scoreP2');
        if (elP1) elP1.textContent = this.scoreP1;
        if (elP2) elP2.textContent = this.scoreP2;
    }

    showOverlay(title, message) {
        const overlay = document.getElementById('gameOverlay');
        const overlayTitle = document.getElementById('overlayTitle');
        const overlayMessage = document.getElementById('overlayMessage');

        if (overlayTitle) overlayTitle.textContent = title;
        if (overlayMessage) overlayMessage.textContent = message;
        if (overlay) overlay.classList.remove('hidden');
    }

    hideOverlay() {
        const overlay = document.getElementById('gameOverlay');
        if (overlay) overlay.classList.add('hidden');
    }

    updateStatusBadge(text, typeClass) {
        const statusBadge = document.getElementById('gameStatusText');
        if (statusBadge) {
            statusBadge.textContent = text;
            statusBadge.className = `status-badge ${typeClass}`;
        }
    }

    processInput(dt) {
        if (this.currentState !== this.STATE.EM_JOGO) return;

        // Jogador 1 (W / S)
        if (this.keysPressed.has('w') || this.keysPressed.has('KeyW')) {
            this.player1.moveUp(dt);
        }
        if (this.keysPressed.has('s') || this.keysPressed.has('KeyS')) {
            this.player1.moveDown(dt, this.height);
        }

        // Jogador 2 (Setas Cima / Baixo)
        if (this.keysPressed.has('arrowup') || this.keysPressed.has('ArrowUp')) {
            this.player2.moveUp(dt);
        }
        if (this.keysPressed.has('arrowdown') || this.keysPressed.has('ArrowDown')) {
            this.player2.moveDown(dt, this.height);
        }
    }

    update(dt) {
        if (this.currentState === this.STATE.EM_JOGO) {
            this.ball.update(
                dt,
                this.player1,
                this.player2,
                this.width,
                this.height,
                this.speedMultiplier,
                (winner) => this.handleScore(winner)
            );
        }
    }

    render() {
        if (!this.gl) return;

        // Limpa o canvas com fundo escuro profundo
        this.gl.clearColor(0.035, 0.043, 0.063, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // 1. Desenha a linha central tracejada
        this.drawDashedCenterLine();

        // 2. Desenha as raquetes
        this.player1.render(this);
        this.player2.render(this);

        // 3. Desenha a bola
        this.ball.render(this);
    }

    loop(timestamp) {
        if (!this.lastTimeStamp) this.lastTimeStamp = timestamp;
        
        // Limita o dt para evitar grandes saltos caso a aba fique inativa
        const dt = Math.min((timestamp - this.lastTimeStamp) / 1000.0, 0.1);
        this.lastTimeStamp = timestamp;

        this.processInput(dt);
        this.update(dt);
        this.render();

        requestAnimationFrame((ts) => this.loop(ts));
    }
}

// Inicialização Automatizada ao Carregar a Página
window.addEventListener('DOMContentLoaded', () => {
    const engine = GameEngine.getInstance('glCanvas');
    engine.init();
});
