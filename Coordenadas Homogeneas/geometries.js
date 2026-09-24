/**
 * Geometrias 3D para o visualizador de Coordenadas Homogêneas
 * Inclui: Cubo, Pirâmide, Prisma Triangular, Tetraedro, Eixos Cartesianos 3D, Grid e Marcador Gizmo
 */

// 1. CUBO CARTESIANO 3D
function createCubeGeometry() {
    const s = 0.5;
    // 8 vértices principais (para lista de inspeção)
    const basePoints = [
        [-s, -s,  s], // V0
        [ s, -s,  s], // V1
        [ s,  s,  s], // V2
        [-s,  s,  s], // V3
        [-s, -s, -s], // V4
        [ s, -s, -s], // V5
        [ s,  s, -s], // V6
        [-s,  s, -s]  // V7
    ];

    // Faces com cores e vértices duplicados para flat-shading vibrante
    const vertices = [];
    const colors = [];
    const indices = [];

    const faceData = [
        // Front (Z+) - Cyan
        { v: [0, 1, 2, 3], c: [0.0, 0.9, 1.0] },
        // Back (Z-) - Blue
        { v: [5, 4, 7, 6], c: [0.1, 0.4, 0.9] },
        // Top (Y+) - Green
        { v: [3, 2, 6, 7], c: [0.0, 0.9, 0.5] },
        // Bottom (Y-) - Dark Green
        { v: [4, 5, 1, 0], c: [0.1, 0.6, 0.3] },
        // Right (X+) - Magenta
        { v: [1, 5, 6, 2], c: [1.0, 0.2, 0.6] },
        // Left (X-) - Purple/Orange
        { v: [4, 0, 3, 7], c: [0.9, 0.4, 0.1] }
    ];

    let idx = 0;
    faceData.forEach(face => {
        const pts = face.v.map(i => basePoints[i]);
        pts.forEach(p => {
            vertices.push(...p);
            colors.push(...face.c);
        });
        indices.push(idx, idx + 1, idx + 2, idx, idx + 2, idx + 3);
        idx += 4;
    });

    return {
        name: "Cubo Cartesiano 3D",
        vertices: new Float32Array(vertices),
        colors: new Float32Array(colors),
        indices: new Uint16Array(indices),
        keyVertices: basePoints.map((p, i) => ({ name: `V${i} (${p[0] > 0 ? '+' : ''}${p[0]}, ${p[1] > 0 ? '+' : ''}${p[1]}, ${p[2] > 0 ? '+' : ''}${p[2]})`, point: [...p, 1.0] }))
    };
}

// 2. PIRÂMIDE 3D (Base Quadrada + Ápice)
function createPyramidGeometry() {
    const s = 0.5;
    const h = 0.7;
    const basePoints = [
        [-s, -0.3,  s], // V0 (Front-Left)
        [ s, -0.3,  s], // V1 (Front-Right)
        [ s, -0.3, -s], // V2 (Back-Right)
        [-s, -0.3, -s], // V3 (Back-Left)
        [ 0,  h - 0.3, 0] // V4 (Apex)
    ];

    const vertices = [];
    const colors = [];
    const indices = [];

    const faces = [
        // Base
        { v: [0, 2, 1], c: [0.2, 0.2, 0.3] },
        { v: [0, 3, 2], c: [0.2, 0.2, 0.3] },
        // Front Face - Cyan
        { v: [0, 1, 4], c: [0.0, 0.85, 1.0] },
        // Right Face - Magenta
        { v: [1, 2, 4], c: [1.0, 0.2, 0.7] },
        // Back Face - Yellow
        { v: [2, 3, 4], c: [1.0, 0.8, 0.0] },
        // Left Face - Green
        { v: [3, 0, 4], c: [0.0, 0.9, 0.4] }
    ];

    let idx = 0;
    faces.forEach(face => {
        face.v.forEach(i => {
            vertices.push(...basePoints[i]);
            colors.push(...face.c);
        });
        indices.push(idx, idx + 1, idx + 2);
        idx += 3;
    });

    return {
        name: "Pirâmide 3D",
        vertices: new Float32Array(vertices),
        colors: new Float32Array(colors),
        indices: new Uint16Array(indices),
        keyVertices: basePoints.map((p, i) => ({ name: `V${i} ${i === 4 ? '(Ápice)' : ''} (${p[0]}, ${p[1].toFixed(1)}, ${p[2]})`, point: [...p, 1.0] }))
    };
}

// 3. PRISMA TRIANGULAR / CILINDRO
function createPrismGeometry() {
    const r = 0.5;
    const h = 0.8;
    const topY = h / 2;
    const botY = -h / 2;

    // 6 vértices
    const topPts = [
        [0, topY, r],
        [r * Math.cos(Math.PI / 6), topY, -r * Math.sin(Math.PI / 6)],
        [-r * Math.cos(Math.PI / 6), topY, -r * Math.sin(Math.PI / 6)]
    ];
    const botPts = [
        [0, botY, r],
        [r * Math.cos(Math.PI / 6), botY, -r * Math.sin(Math.PI / 6)],
        [-r * Math.cos(Math.PI / 6), botY, -r * Math.sin(Math.PI / 6)]
    ];

    const allPts = [...topPts, ...botPts];

    const vertices = [];
    const colors = [];
    const indices = [];

    // Top Cap
    vertices.push(...topPts[0], ...topPts[1], ...topPts[2]);
    colors.push(0.0, 0.9, 1.0,  0.0, 0.9, 1.0,  0.0, 0.9, 1.0);
    indices.push(0, 1, 2);

    // Bottom Cap
    vertices.push(...botPts[0], ...botPts[2], ...botPts[1]);
    colors.push(0.1, 0.4, 0.8,  0.1, 0.4, 0.8,  0.1, 0.4, 0.8);
    indices.push(3, 4, 5);

    let idx = 6;
    // 3 Side Quad Faces
    const sides = [
        { v: [topPts[0], topPts[1], botPts[1], botPts[0]], c: [1.0, 0.3, 0.6] },
        { v: [topPts[1], topPts[2], botPts[2], botPts[1]], c: [1.0, 0.8, 0.1] },
        { v: [topPts[2], topPts[0], botPts[0], botPts[2]], c: [0.1, 0.9, 0.5] }
    ];

    sides.forEach(s => {
        s.v.forEach(p => {
            vertices.push(...p);
            colors.push(...s.c);
        });
        indices.push(idx, idx + 1, idx + 2, idx, idx + 2, idx + 3);
        idx += 4;
    });

    return {
        name: "Prisma Triangular",
        vertices: new Float32Array(vertices),
        colors: new Float32Array(colors),
        indices: new Uint16Array(indices),
        keyVertices: allPts.map((p, i) => ({ name: `V${i} (${p[0].toFixed(2)}, ${p[1].toFixed(2)}, ${p[2].toFixed(2)})`, point: [...p, 1.0] }))
    };
}

// 4. TETRAEDRO GEOMÉTRICO 3D
function createTetrahedronGeometry() {
    const a = 0.6;
    const basePoints = [
        [ a,  a,  a],
        [-a, -a,  a],
        [-a,  a, -a],
        [ a, -a, -a]
    ];

    const vertices = [];
    const colors = [];
    const indices = [];

    const faces = [
        { v: [0, 1, 2], c: [0.0, 0.9, 1.0] },
        { v: [0, 3, 1], c: [1.0, 0.2, 0.7] },
        { v: [0, 2, 3], c: [1.0, 0.85, 0.0] },
        { v: [1, 3, 2], c: [0.1, 0.9, 0.5] }
    ];

    let idx = 0;
    faces.forEach(face => {
        face.v.forEach(i => {
            vertices.push(...basePoints[i]);
            colors.push(...face.c);
        });
        indices.push(idx, idx + 1, idx + 2);
        idx += 3;
    });

    return {
        name: "Tetraedro 3D",
        vertices: new Float32Array(vertices),
        colors: new Float32Array(colors),
        indices: new Uint16Array(indices),
        keyVertices: basePoints.map((p, i) => ({ name: `V${i} (${p[0]}, ${p[1]}, ${p[2]})`, point: [...p, 1.0] }))
    };
}

// 5. EIXOS CARTESIANOS 3D (X=Vermelho, Y=Verde, Z=Azul)
function createAxesGeometry() {
    const len = 1.6;
    const vertices = new Float32Array([
        // Eixo X
        0, 0, 0,   len, 0, 0,
        // Eixo Y
        0, 0, 0,   0, len, 0,
        // Eixo Z
        0, 0, 0,   0, 0, len
    ]);
    const colors = new Float32Array([
        // X Red
        1.0, 0.2, 0.2,   1.0, 0.2, 0.2,
        // Y Green
        0.2, 1.0, 0.3,   0.2, 1.0, 0.3,
        // Z Blue
        0.2, 0.5, 1.0,   0.2, 0.5, 1.0
    ]);
    const indices = new Uint16Array([0, 1, 2, 3, 4, 5]);

    return {
        vertices,
        colors,
        indices,
        isLines: true
    };
}

// 6. GRID NO PISO CARTESIANO (Plano XZ)
function createGridGeometry(size = 2.0, steps = 10) {
    const vertices = [];
    const colors = [];
    const indices = [];
    const half = size / 2;
    const step = size / steps;
    const y = -0.6;
    let idx = 0;

    for (let i = -half; i <= half + 0.001; i += step) {
        // Linhas paralelas a Z
        vertices.push(i, y, -half,  i, y, half);
        // Linhas paralelas a X
        vertices.push(-half, y, i,  half, y, i);

        const col = Math.abs(i) < 0.001 ? [0.4, 0.5, 0.7] : [0.15, 0.2, 0.3];
        colors.push(...col, ...col, ...col, ...col);

        indices.push(idx, idx + 1, idx + 2, idx + 3);
        idx += 4;
    }

    return {
        vertices: new Float32Array(vertices),
        colors: new Float32Array(colors),
        indices: new Uint16Array(indices),
        isLines: true
    };
}

// 7. GIZMO / MARCADOR DO VÉRTICE RASTREADO
function createGizmoMarkerGeometry() {
    const s = 0.045;
    const vertices = new Float32Array([
         0,  s,  0,
        -s,  0,  0,
         0,  0,  s,
         s,  0,  0,
         0,  0, -s,
         0, -s,  0
    ]);
    const colors = new Float32Array([
        1.0, 0.2, 0.8,
        1.0, 0.9, 0.0,
        1.0, 0.2, 0.8,
        1.0, 0.9, 0.0,
        1.0, 0.2, 0.8,
        0.0, 1.0, 0.9
    ]);
    const indices = new Uint16Array([
        0, 1, 2,  0, 2, 3,  0, 3, 4,  0, 4, 1,
        5, 2, 1,  5, 3, 2,  5, 4, 3,  5, 1, 4
    ]);
    return {
        vertices,
        colors,
        indices
    };
}
