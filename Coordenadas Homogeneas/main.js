/**
 * Inicialização WebGL, Shaders, Handlers de Eventos de Mouse/Touch e Bindings da UI
 */

const vertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec3 aColor;

    uniform mat4 u_model;
    uniform mat4 u_view;
    uniform mat4 u_projection;

    varying vec3 vColor;

    void main() {
        gl_Position = u_projection * u_view * u_model * vec4(aPosition, 1.0);
        vColor = aColor;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying vec3 vColor;

    void main() {
        gl_FragColor = vec4(vColor, 1.0);
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Erro Shader:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vs, fs) {
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Erro Program:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

window.onload = function() {
    const canvas = document.getElementById("glCanvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("WebGL não suportado pelo navegador.");
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vs, fs);

    const scene = new Scene(gl, program);
    scene.init();

    // ==========================================
    // BINDINGS: SELEÇÃO DE MODELO E STEPPER
    // ==========================================
    const modelSelect = document.getElementById("modelSelect");
    modelSelect.addEventListener("change", (e) => {
        scene.setModel(e.target.value);
    });

    const stepButtons = document.querySelectorAll(".step-btn");
    const hudStepTitle = document.getElementById("hudStepTitle");
    const stepTitles = [
        "Matriz I (Identidade)",
        "Matriz S (Escala)",
        "Matriz R·S (Rotação e Escala)",
        "Matriz Final M (T·R·S)"
    ];

    stepButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const step = parseInt(btn.getAttribute("data-step"));
            scene.setStep(step);
            stepButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            hudStepTitle.textContent = stepTitles[step];
        });
    });

    // ==========================================
    // BINDINGS: CONTROLES DE TRANSFORMAÇÃO
    // ==========================================
    const posX = document.getElementById("posX");
    const posY = document.getElementById("posY");
    const posZ = document.getElementById("posZ");
    const rotX = document.getElementById("rotX");
    const rotY = document.getElementById("rotY");
    const rotZ = document.getElementById("rotZ");
    const scale = document.getElementById("scale");

    const dispPosX = document.getElementById("dispPosX");
    const dispPosY = document.getElementById("dispPosY");
    const dispPosZ = document.getElementById("dispPosZ");
    const dispRotX = document.getElementById("dispRotX");
    const dispRotY = document.getElementById("dispRotY");
    const dispRotZ = document.getElementById("dispRotZ");
    const dispScale = document.getElementById("dispScale");

    function updateUIValues() {
        dispPosX.textContent = Number(scene.posX).toFixed(2);
        dispPosY.textContent = Number(scene.posY).toFixed(2);
        dispPosZ.textContent = Number(scene.posZ).toFixed(2);

        const degX = Math.round(scene.rotX * 180 / Math.PI);
        const degY = Math.round(scene.rotY * 180 / Math.PI);
        const degZ = Math.round(scene.rotZ * 180 / Math.PI);

        dispRotX.textContent = `${degX}°`;
        dispRotY.textContent = `${degY}°`;
        dispRotZ.textContent = `${degZ}°`;

        dispScale.textContent = `${Number(scene.scaleX).toFixed(2)}x`;
    }

    posX.addEventListener("input", (e) => {
        scene.posX = parseFloat(e.target.value);
        dispPosX.textContent = Number(scene.posX).toFixed(2);
    });
    posY.addEventListener("input", (e) => {
        scene.posY = parseFloat(e.target.value);
        dispPosY.textContent = Number(scene.posY).toFixed(2);
    });
    posZ.addEventListener("input", (e) => {
        scene.posZ = parseFloat(e.target.value);
        dispPosZ.textContent = Number(scene.posZ).toFixed(2);
    });

    rotX.addEventListener("input", (e) => {
        scene.rotX = parseFloat(e.target.value) * Math.PI / 180;
        dispRotX.textContent = `${e.target.value}°`;
    });
    rotY.addEventListener("input", (e) => {
        scene.rotY = parseFloat(e.target.value) * Math.PI / 180;
        dispRotY.textContent = `${e.target.value}°`;
    });
    rotZ.addEventListener("input", (e) => {
        scene.rotZ = parseFloat(e.target.value) * Math.PI / 180;
        dispRotZ.textContent = `${e.target.value}°`;
    });

    scale.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        scene.scaleX = val;
        scene.scaleY = val;
        scene.scaleZ = val;
        dispScale.textContent = `${val.toFixed(2)}x`;
    });

    // ==========================================
    // BINDINGS: VÉRTICES E ESPAÇO [X, Y, Z, H]
    // ==========================================
    const vertexSelect = document.getElementById("vertexSelect");
    const btnToggleCustom = document.getElementById("btnToggleCustom");

    const inCustomX = document.getElementById("inCustomX");
    const inCustomY = document.getElementById("inCustomY");
    const inCustomZ = document.getElementById("inCustomZ");
    const inCustomH = document.getElementById("inCustomH");

    const valInX = document.getElementById("valInX");
    const valInY = document.getElementById("valInY");
    const valInZ = document.getElementById("valInZ");
    const valInH = document.getElementById("valInH");

    vertexSelect.addEventListener("change", (e) => {
        scene.selectedVertexIndex = parseInt(e.target.value);
    });

    btnToggleCustom.addEventListener("click", () => {
        scene.isCustomPoint = !scene.isCustomPoint;
        btnToggleCustom.textContent = scene.isCustomPoint ? "Vértice Pré-definido" : "Modo Custom";
        btnToggleCustom.style.background = scene.isCustomPoint ? "var(--neon-green)" : "";
        btnToggleCustom.style.color = scene.isCustomPoint ? "#050811" : "";

        const dSpan = scene.isCustomPoint ? "none" : "inline";
        const dInput = scene.isCustomPoint ? "inline-block" : "none";

        valInX.style.display = dSpan;
        valInY.style.display = dSpan;
        valInZ.style.display = dSpan;
        valInH.style.display = dSpan;

        inCustomX.style.display = dInput;
        inCustomY.style.display = dInput;
        inCustomZ.style.display = dInput;
        inCustomH.style.display = dInput;
    });

    function updateCustomPoint() {
        scene.customPoint = [
            parseFloat(inCustomX.value) || 0,
            parseFloat(inCustomY.value) || 0,
            parseFloat(inCustomZ.value) || 0,
            parseFloat(inCustomH.value) !== undefined ? parseFloat(inCustomH.value) : 1.0
        ];
    }

    inCustomX.addEventListener("input", updateCustomPoint);
    inCustomY.addEventListener("input", updateCustomPoint);
    inCustomZ.addEventListener("input", updateCustomPoint);
    inCustomH.addEventListener("input", updateCustomPoint);

    // ==========================================
    // BINDINGS: BOTÕES DE CÂMERA & PRESETS
    // ==========================================
    const camButtons = document.querySelectorAll("[data-cam]");
    camButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const preset = btn.getAttribute("data-cam");
            scene.setCameraPreset(preset);
            if (preset === 'reset') {
                posX.value = 0; posY.value = 0; posZ.value = 0;
                rotX.value = 0; rotY.value = 0; rotZ.value = 0;
                scale.value = 1.0;
                stepButtons.forEach(b => b.classList.remove("active"));
                document.querySelector("[data-step='3']").classList.add("active");
                hudStepTitle.textContent = stepTitles[3];
                updateUIValues();
            }
        });
    });

    const btnAutoRotateObj = document.getElementById("btnAutoRotateObj");
    const btnAutoRotateCam = document.getElementById("btnAutoRotateCam");
    const btnResetAll = document.getElementById("btnResetAll");

    btnAutoRotateObj.addEventListener("click", () => {
        scene.autoRotateObject = !scene.autoRotateObject;
        btnAutoRotateObj.classList.toggle("active", scene.autoRotateObject);
    });

    btnAutoRotateCam.addEventListener("click", () => {
        scene.autoRotateCamera = !scene.autoRotateCamera;
        btnAutoRotateCam.classList.toggle("active", scene.autoRotateCamera);
    });

    btnResetAll.addEventListener("click", () => {
        scene.setCameraPreset('reset');
        scene.autoRotateObject = false;
        scene.autoRotateCamera = false;
        btnAutoRotateObj.classList.remove("active");
        btnAutoRotateCam.classList.remove("active");
        updateUIValues();
    });

    // ==========================================
    // INTERAÇÃO ORBITAL DO MOUSE (DRAG & ZOOM)
    // ==========================================
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    canvas.addEventListener("mousedown", (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    window.addEventListener("mouseup", () => {
        isDragging = false;
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;

        scene.cameraYaw += deltaX * 0.01;
        scene.cameraPitch += deltaY * 0.01;

        // Limitar pitch para não inverter a câmera
        scene.cameraPitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, scene.cameraPitch));

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    // Zoom com a roda do mouse
    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        scene.cameraDistance += e.deltaY * 0.003;
        scene.cameraDistance = Math.max(1.2, Math.min(10.0, scene.cameraDistance));
    }, { passive: false });

    // Sincronização em tempo real quando o objeto estiver auto-rotacionando
    setInterval(() => {
        if (scene.autoRotateObject) {
            updateUIValues();
        }
    }, 100);
};
