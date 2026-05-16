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
    const techMatrix = document.getElementById('tech-matrix'); // Referencia al fondo
    
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    function updateVisuals(percent) {
        // 1. Llenar el anillo
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        // 2. Revelar el fondo brillante (Opacidad de 0 a 1)
        techMatrix.style.opacity = percent / 100;
        
        // 3. Efecto de Zoom (De 0.8 a 1.0)
        const scale = 0.8 + (percent / 100) * 0.2;
        techMatrix.style.transform = `scale(${scale})`;
    }

    function startAuth(e) {
        if (isProcessing) return;
        if (e.type === 'mousedown' && e.button !== 0) return;
        
        isAuthorizing = true;
        statusText.innerText = "Inyectando energia al sistema...";
        statusText.style.color = "#38bdf8";

        clearInterval(authInterval);
        authInterval = setInterval(() => {
            authProgress += 1.5; // Velocidad
            updateVisuals(authProgress);

            if (authProgress >= 100) {
                clearInterval(authInterval);
                executeAISequence();
            }
        }, 30);
    }

    function stopAuth() {
        if (isProcessing) return;
        isAuthorizing = false;
        clearInterval(authInterval);
        
        // Apagar las luces suavemente si suelta
        authInterval = setInterval(() => {
            authProgress -= 3;
            if (authProgress <= 0) {
                authProgress = 0;
                clearInterval(authInterval);
                statusText.innerText = "Autorización interrumpida. Mantenga pulsado.";
                statusText.style.color = "#94a3b8";
            }
            updateVisuals(authProgress);
        }, 20);
    }

    btn.addEventListener('mousedown', startAuth);
    btn.addEventListener('touchstart', startAuth, {passive: true});
    window.addEventListener('mouseup', stopAuth);
    window.addEventListener('touchend', stopAuth);
}

async function executeAISequence() {
    isProcessing = true;
    const btn = document.getElementById('auth-btn');
    const statusText = document.getElementById('ai-status-text');
    const circle = document.querySelector('.progress-ring__circle');
    const techMatrix = document.getElementById('tech-matrix');

    btn.classList.add('processing');
    circle.style.stroke = "#10b981"; 
    
    // Destello de las palabras al completar
    techMatrix.style.color = "#10b981";
    techMatrix.style.textShadow = "0 0 25px #10b981";
    
    statusText.innerText = "Desencriptación completa. Enlazando API...";
    statusText.style.color = "#10b981";

    try {
        const minAnimTime = new Promise(resolve => setTimeout(resolve, 1500));
        
        const fetchPromise = fetch(`${BASE_URL}/api/cv-data`).then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        });

        const [_, data] = await Promise.all([minAnimTime, fetchPromise]);
        
        apiData = data;
        statusText.innerText = "Acceso concedido.";
        
        renderPortfolioData();

        setTimeout(() => {
            document.getElementById('ai-boot-screen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('ai-boot-screen').style.display = 'none';
                document.getElementById('main-portfolio').style.display = 'block';
                
                document.querySelectorAll('.progress-fill').forEach(bar => {
                    const target = bar.getAttribute('data-val');
                    bar.style.transition = "width 1.5s cubic-bezier(0.1, 1, 0.1, 1)";
                    bar.style.width = `${target}%`;
                });
            }, 800);
        }, 800);

    } catch (error) {
        statusText.innerText = "Error (Cold Start). Render despertando. Reintentando...";
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

async function descargarCV() {
    const btn = document.getElementById('downloadBtn');
    btn.disabled = true;
    btn.innerHTML = '⏳ Procesando en Python...';

    try {
        const response = await fetch(`${BASE_URL}/descargar-cv`);
        if (!response.ok) throw new Error();
        
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
        alert("Error de comunicación con el servidor.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '📥 Generar y Descargar PDF Oficial';
    }
}