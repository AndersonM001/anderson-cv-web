const BASE_URL = "https://anderson-cv-api.onrender.com";

let apiData = null;
let isAuthorizing = false;
let authProgress = 0;
let authInterval;
let isProcessing = false;

document.addEventListener('DOMContentLoaded', () => {
    initHoldToUnlock();
    document.getElementById('downloadBtn').addEventListener('click', descargarCV);
});

function initHoldToUnlock() {
    const btn = document.getElementById('auth-btn');
    const circle = document.querySelector('.progress-ring__circle');
    const statusText = document.getElementById('ai-status-text');
    
    // Cálculo para el SVG Ring
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    function setProgress(percent) {
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }

    function startAuth(e) {
        if (isProcessing) return;
        // Evita que el click derecho o arrastrar interfiera
        if (e.type === 'mousedown' && e.button !== 0) return; 
        
        isAuthorizing = true;
        statusText.innerText = "Autorizando credenciales...";
        statusText.style.color = "#38bdf8";

        clearInterval(authInterval);
        authInterval = setInterval(() => {
            authProgress += 2; // Velocidad de llenado
            setProgress(authProgress);

            if (authProgress >= 100) {
                clearInterval(authInterval);
                executeAISequence(); // Desbloqueado!
            }
        }, 30);
    }

    function stopAuth() {
        if (isProcessing) return;
        isAuthorizing = false;
        clearInterval(authInterval);
        
        // Regresa la barra a 0 suavemente
        authInterval = setInterval(() => {
            authProgress -= 4;
            if (authProgress <= 0) {
                authProgress = 0;
                clearInterval(authInterval);
                statusText.innerText = "Autorización abortada. Mantenga pulsado.";
                statusText.style.color = "#64748b";
            }
            setProgress(authProgress);
        }, 20);
    }

    // Eventos para PC y Móviles
    btn.addEventListener('mousedown', startAuth);
    btn.addEventListener('touchstart', startAuth, {passive: true});
    window.addEventListener('mouseup', stopAuth);
    window.addEventListener('touchend', stopAuth);
}

// Secuencia cuando el usuario completa el anillo
async function executeAISequence() {
    isProcessing = true;
    const btn = document.getElementById('auth-btn');
    const statusText = document.getElementById('ai-status-text');
    const circle = document.querySelector('.progress-ring__circle');

    // Cambiar UI a modo procesamiento (Muestra el orbe giratorio)
    btn.classList.add('processing');
    circle.style.stroke = "#10b981"; // Cambia anillo a verde
    statusText.innerText = "Iniciando motor neuronal...";
    statusText.style.color = "#10b981";

    try {
        // Simulamos un poco de tiempo artificial (1.5s) para que el usuario 
        // pueda disfrutar de la animación visual incluso si la API es ultra rápida.
        const minAnimTime = new Promise(resolve => setTimeout(resolve, 1500));
        
        statusText.innerText = "Extrayendo perfil desde Render Serverless...";
        
        // Petición real a tu API en Python
        const fetchPromise = fetch(`${BASE_URL}/api/cv-data`).then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        });

        // Esperamos ambas cosas (que pase el tiempo mínimo y que llegue la data)
        const [_, data] = await Promise.all([minAnimTime, fetchPromise]);
        
        apiData = data;
        statusText.innerText = "Datos compilados. Abriendo interfaz...";
        
        // Llenar el HTML (Igual que antes)
        renderPortfolioData();

        // Transición de salida
        setTimeout(() => {
            document.getElementById('ai-boot-screen').style.opacity = '0';
            document.getElementById('ai-boot-screen').style.visibility = 'hidden';
            document.getElementById('main-portfolio').style.display = 'block';
            
            // Animación de barras de skills
            document.querySelectorAll('.progress-fill').forEach(bar => {
                const target = bar.getAttribute('data-val');
                bar.style.transition = "width 1.5s cubic-bezier(0.1, 1, 0.1, 1)";
                bar.style.width = `${target}%`;
            });
        }, 800);

    } catch (error) {
        statusText.innerText = "Error de conexión (Cold Start). Reintentando...";
        statusText.style.color = "#ef4444";
        circle.style.stroke = "#ef4444";
        setTimeout(() => { window.location.reload(); }, 4000);
    }
}

function renderPortfolioData() {
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
}

// ... Mantén tu función descargarCV() exactamente igual aquí abajo ...
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