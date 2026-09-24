/**
 * Classe Renderer WebGL com suporte a Model-View-Projection (MVP),
 * renderização de malhas sólidas (TRIANGLES) e linhas (LINES para eixos/grid).
 */

class Renderer {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;

        this.positionLocation = gl.getAttribLocation(program, "aPosition");
        this.colorLocation = gl.getAttribLocation(program, "aColor");

        this.modelMatrixLocation = gl.getUniformLocation(program, "u_model");
        this.viewMatrixLocation = gl.getUniformLocation(program, "u_view");
        this.projMatrixLocation = gl.getUniformLocation(program, "u_projection");

        this.verticesBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
    }

    setCamera(viewMatrix, projMatrix) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(this.viewMatrixLocation, false, viewMatrix);
        gl.uniformMatrix4fv(this.projMatrixLocation, false, projMatrix);
    }

    drawMesh(geometry, modelMatrix) {
        const gl = this.gl;
        gl.useProgram(this.program);

        // Vértices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);

        // Cores
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry.colors, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.colorLocation);
        gl.vertexAttribPointer(this.colorLocation, 3, gl.FLOAT, false, 0, 0);

        // Índices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.DYNAMIC_DRAW);

        // Uniform Model Matrix
        gl.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix);

        // Modo de Desenho: Linhas ou Triângulos
        const mode = geometry.isLines ? gl.LINES : gl.TRIANGLES;
        gl.drawElements(mode, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}
