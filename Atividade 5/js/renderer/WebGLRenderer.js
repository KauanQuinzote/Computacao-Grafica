import { m3 } from '../math/m3.js';

/**
 * WebGLRenderer - Motor Gráfico WebGL (Módulo Profundo)
 * Oculta completamente o contexto GL, compilação de shaders, buffers e uniforms.
 */
export class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!this.gl) {
            throw new Error('WebGL não é suportado pelo seu navegador.');
        }

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Ativa Blending para transparência e anti-aliasing de cantos arredondados
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // Inicializa Recursos Gráficos
        this.programInfo = this.initShaders();
        this.initBuffers();
    }

    initShaders() {
        const vsSource = `
            attribute vec2 a_position;
            uniform mat3 u_matrix;
            varying vec2 v_position;

            void main() {
                v_position = a_position;
                vec3 position = u_matrix * vec3(a_position, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
            }
        `;

        const fsSource = `
            precision mediump float;
            uniform vec4 u_color;
            uniform float u_cornerRadius;
            uniform float u_aspect;
            varying vec2 v_position;

            void main() {
                if (u_cornerRadius <= 0.001) {
                    gl_FragColor = u_color;
                    return;
                }

                // Coordenadas locais centralizadas com correção de aspect ratio
                vec2 p = vec2(v_position.x, (v_position.y - 0.5) * u_aspect);
                vec2 halfSize = vec2(0.5, 0.5 * u_aspect);
                float r = min(u_cornerRadius, min(halfSize.x, halfSize.y));

                vec2 d = abs(p) - (halfSize - vec2(r));
                float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;

                float alpha = 1.0 - smoothstep(-0.015, 0.015, dist);
                if (alpha < 0.01) discard;

                gl_FragColor = vec4(u_color.rgb, u_color.a * alpha);
            }
        `;

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(program);
            throw new Error('Erro ao linkar programa WebGL: ' + info);
        }

        this.gl.useProgram(program);

        return {
            program: program,
            attribs: {
                position: this.gl.getAttribLocation(program, 'a_position')
            },
            uniforms: {
                matrix: this.gl.getUniformLocation(program, 'u_matrix'),
                color: this.gl.getUniformLocation(program, 'u_color'),
                cornerRadius: this.gl.getUniformLocation(program, 'u_cornerRadius'),
                aspect: this.gl.getUniformLocation(program, 'u_aspect')
            }
        };
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error('Erro de compilação no Shader: ' + info);
        }
        return shader;
    }

    initBuffers() {
        // Buffer Retângulo unitário (pivô topo-centro)
        const rectBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, rectBuffer);
        const rectPositions = new Float32Array([
            -0.5, 0.0,
             0.5, 0.0,
            -0.5, 1.0,
            -0.5, 1.0,
             0.5, 0.0,
             0.5, 1.0,
        ]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, rectPositions, this.gl.STATIC_DRAW);

        // Buffer Trapezoidal / Triângulo Escaleno (Base menor no topo, base maior embaixo)
        const trapezoidBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, trapezoidBuffer);
        const trapezoidPositions = new Float32Array([
            -0.22, 0.0,
             0.22, 0.0,
            -0.55, 1.0,
            -0.55, 1.0,
             0.22, 0.0,
             0.55, 1.0,
        ]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, trapezoidPositions, this.gl.STATIC_DRAW);

        this.buffers = {
            rect: rectBuffer,
            trapezoid: trapezoidBuffer
        };

        this.gl.enableVertexAttribArray(this.programInfo.attribs.position);
    }

    clear(r = 0.024, g = 0.035, b = 0.055, a = 1.0) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    renderTree(rootNode) {
        this.clear();

        // Matriz Projeção (Pixels 800x600 -> Clip Space)
        const projectionMatrix = m3.projection(this.canvas.width, this.canvas.height);

        // Atualiza a árvore do grafo de cena
        rootNode.updateWorldMatrix(null);

        // Renderiza recursivamente os nós
        this.drawNode(rootNode, projectionMatrix);
    }

    drawNode(node, projectionMatrix) {
        if (node.visible === false) return;

        // Seleciona o buffer de vértices conforme shapeType
        if (node.shapeType === 'trapezoid' || node.shapeType === 'triangle') {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.trapezoid);
        } else {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.rect);
        }
        this.gl.vertexAttribPointer(this.programInfo.attribs.position, 2, this.gl.FLOAT, false, 0, 0);

        // Mfinal = Mprojection * Mworld
        const finalMatrix = m3.multiply(projectionMatrix, node.worldMatrix);

        // Aspect ratio local do nó para preservação da proporção dos cantos arredondados
        const scaleX = Math.max(Math.abs(node.scale[0]), 0.0001);
        const scaleY = Math.max(Math.abs(node.scale[1]), 0.0001);
        const aspect = scaleY / scaleX;

        // Envia uniforms para o Shader
        this.gl.uniformMatrix3fv(this.programInfo.uniforms.matrix, false, finalMatrix);
        this.gl.uniform4fv(this.programInfo.uniforms.color, node.color);
        this.gl.uniform1f(this.programInfo.uniforms.cornerRadius, node.cornerRadius || 0.0);
        this.gl.uniform1f(this.programInfo.uniforms.aspect, aspect);

        // Desenha os 6 vértices
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        // Recursão para os filhos
        for (const child of node.children) {
            this.drawNode(child, projectionMatrix);
        }
    }
}
