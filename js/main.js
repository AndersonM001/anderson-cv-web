const BASE_URL = "https://anderson-cv-api.onrender.com";

let apiData = null;
let connectionsCount = 0;
let selectedNode = null;
const totalConnectionsRequired = 3;

// --- CONFIGURACIÓN DE EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar lógica de nodos
    initializeNodes();
    
    // Iniciar fetch de datos
    fetchAPIData();

    // Asignar eventos a los botones principales
    document.getElementById('enter-system-btn').addEventListener('click', enterPortfolio);
    document.getElementById('downloadBtn').addEventListener('click', descargarCV);
});

// --- MOTOR DEL JUEGO DE INTERCONEXIÓN ---
function initializeNodes() {
    document.querySelectorAll('.node').forEach(node => {
        node.addEventListener('click', () => {
            if (node.classList.contains('connected')) return;

            const side = node.getAttribute('data-side');

            if (side === 'left') {
                if (selectedNode) selectedNode.classList.remove('selected');
                selectedNode = node;
                node.classList.add('selected');
            } else if (side === 'right' && selectedNode) {
                // Intento de conexión
                if (selectedNode.getAttribute('data-match') === node.getAttribute('data-match')) {
                    // ¡Combinación correcta!
                    drawCable(selectedNode, node);
                    selectedNode.classList.remove('selected');
                    selectedNode.classList.add('connected');
                    node.classList.add('connected');
                    selectedNode = null;
                    connectionsCount++;
                    
                    checkGameCompletion();
                } else {
                    // Error de emparejamiento
                    node.classList.add('error-flash');
                    selectedNode.classList.add('error-flash');
                    setTimeout(() => {
                        node.classList.remove('error-flash');
                        selectedNode.classList.remove('error-flash');
                        selectedNode.classList.remove('selected');
                        selectedNode = null;
                    }, 4000);
                }
            }
        });
    });
}

// Función para mapear y dibujar los cables usando SVG
function drawCable(nodeLeft, nodeRight) {
    const canvas = document.getElementById('svg-canvas');
    const boardRect = document.getElementById('game-board').getBoundingClientRect();
    const leftRect = nodeLeft.getBoundingClientRect();
    const rightRect = nodeRight.getBoundingClientRect();

    // Calcular puntos relativos de los jacks
    const x1 = leftRect.right - boardRect.left - 20;
    const y1 = leftRect.top + (leftRect.height / 2) - boardRect.top;
    const x2 = rightRect.left - boardRect.left + 20;
    const y2 = rightRect.top + (rightRect.height / 2) - boardRect.top;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1); line.setAttribute("y1", y1);
    line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.setAttribute("class", "cable-stable");
    canvas.appendChild(line);
}

// --- VERIFICACIÓN DE ESTADO COMBINADO ---
function checkGameCompletion() {
    if (connectionsCount === totalConnectionsRequired) {
        document.getElementById('access-panel').style.display = 'block';
        evaluateSystemReady();
    }
}

function evaluateSystemReady() {
    const msgEl = document.getElementById('sync-msg');
    const enterBtn = document.getElementById('enter-system-btn');

    if (connectionsCount === totalConnectionsRequired && apiData) {
        msgEl.innerText = "ESTADO: ENLACE COMPLETO. API RESPONDDIENDO DESDE RENDER [ONLINE]";
        msgEl.style.color = "var(--accent-green)";
        enterBtn.disabled = false;
    } else if (connectionsCount === totalConnectionsRequired && !apiData) {
        msgEl.innerText = "CABLEADO COMPLETO. ESPERANDO RESPUESTA DE LA API EN LA NUBE (COLD START)...";
        msgEl.style.color = "var(--accent-blue)";
    }
}

// --- CONSUMO ASÍNCRONO DE LA API (ÚNICA FUENTE DE VERDAD) ---
async function fetchAPIData() {
    try {
        const response = await fetch(`${BASE_URL}/api/cv-data`);
        if (!response.ok) throw new Error();
        apiData = await response.json();

        // Poblar la UI de forma transparente tras bambalinas
        document.getElementById('web-nombre').innerText = apiData.info_personal.nombre;
        document.getElementById('web-titulo').innerText = apiData.info_personal.perfil_corto;
        document.getElementById('web-resumen').innerText = apiData.info_personal.resumen;

        apiData.skills.forEach(skill => {
            const html = `
                <div class="skill-container">
                    <div class="skill-name"><span>${skill.name}</span><span>${skill.percentage}%</span></div>
                    <div class="progress-bar"><div class="progress-fill" data-val="${skill.percentage}"></div></div>
                </div>`;
            document.getElementById(`skills-${skill.category}`).innerHTML += html;
        });

        apiData.experiencia.forEach(exp => {
            let liHtml = exp.detalles.map(d => `<li>${d}</li>`).join('');
            let tagsHtml = exp.tags ? exp.tags.map(t => `<span class="tag">${t}</span>`).join('') : '';
            const expHtml = `
                <div class="timeline-item">
                    <div class="timeline-header"><span>${exp.cargo}</span><span>${exp.fechas}</span></div>
                    <div class="timeline-company">${exp.empresa}</div>
                    <ul>${liHtml}</ul>
                    <div class="tag-container">${tagsHtml}</div>
                </div>`;
            document.getElementById('experience-container').innerHTML += expHtml;
        });

        // Si el usuario ya terminó el juego, evaluamos de inmediato
        evaluateSystemReady();

    } catch (error) {
        console.error("Fallo al conectar con la API, reintentando...", error);
        // Manejo automático de reintentos por caída o retraso del Cold Start
        setTimeout(() => { window.location.reload(); }, 6000);
    }
}

// --- TRANSICIÓN ESTÉTICA ---
function enterPortfolio() {
    const screen = document.getElementById('soc-screen');
    const main = document.getElementById('main-portfolio');
    
    screen.classList.add('fade-out');
    
    setTimeout(() => {
        screen.style.display = 'none';
        main.style.display = 'block';
        
        // Disparar las animaciones de carga de barras de progreso
        document.querySelectorAll('.progress-fill').forEach(bar => {
            const target = bar.getAttribute('data-val');
            bar.style.transition = "width 1.5s cubic-bezier(0.1, 1, 0.1, 1)";
            bar.style.width = `${target}%`;
        });
    }, 800);
}

// --- DESCARGA DEL PDF BINARIO NATIVO ---
async function descargarCV() {
    const btn = document.getElementById('downloadBtn');
    btn.disabled = true;
    btn.innerHTML = '⏳ Procesando en Python...';

    try {
        const response = await fetch(`${BASE_URL}/descargar-cv`);
        if (!response.ok) throw new Error("Error en el motor de generación");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'CV_Anderson_Moncada.pdf';
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        alert("Error de comunicación con el motor generador. Verifica la conexión.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '📥 Generar y Descargar PDF Oficial';
    }
}