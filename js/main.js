const BASE_URL = "https://anderson-cv-api.onrender.com";

// ========================================================
// INICIALIZACIÓN DE FIREBASE (FRONTEND)
// ========================================================
const firebaseConfig = {
    apiKey: "AIzaSyBDlSwnQ9oG1qMb2JIP_YwyhLy-VytSZeE",
    authDomain: "anderson-portfolio-37ac2.firebaseapp.com",
    projectId: "anderson-portfolio-37ac2",
    storageBucket: "anderson-portfolio-37ac2.firebasestorage.app",
    messagingSenderId: "602223038367",
    appId: "1:602223038367:web:f1b396c2d7dd77ee8e77aa",
    measurementId: "G-5CKTRZ15CN"
};
firebase.initializeApp(firebaseConfig);
const dbFS = firebase.firestore();

// ========================================================
// VARIABLES Y EVENTOS
// ========================================================
let apiData = null;
let isAuthorizing = false;
let authProgress = 0;
let authInterval;
let isProcessing = false;

const techStack = [
    "Docker Engine", "Kotlin MVVM", "Python / FastAPI", 
    "GLPI & Vaultwarden", "ISO 27001 SOC", "GPO & AD", 
    "Firebase / Firestore", "Bash Scripting", "Linux Server"
];

document.addEventListener('DOMContentLoaded', () => {
    initHoldToUnlock();
    document.getElementById('downloadBtn').addEventListener('click', descargarCV);
});

// ========================================================
// MOTOR DEL TUTORIAL E INTERFAZ (HOLD TO AUTHORIZE)
// ========================================================
function initHoldToUnlock() {
    const btn = document.getElementById('auth-btn');
    const circle = document.querySelector('.progress-ring__circle');
    const statusText = document.getElementById('ai-status-text');
    const techMatrix = document.getElementById('tech-matrix');
    const authCard = document.getElementById('auth-card');
    
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    window.addEventListener('mousemove', (e) => {
        if (isProcessing) return;
        const xAxis = (window.innerWidth / 2 - e.pageX) / 40;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 40;
        authCard.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });

    function updateVisuals(percent) {
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;
        techMatrix.style.opacity = percent / 100;
        const scale = 0.8 + (percent / 100) * 0.2;
        techMatrix.style.transform = `scale(${scale})`;
    }

    function startAuth(e) {
        if (isProcessing) return;
        if (e.type === 'mousedown' && e.button !== 0) return;
        
        // ACTIVAR PANTALLA COMPLETA MÓVIL
        if (e.type === 'touchstart') {
            const docEl = document.documentElement;
            if (docEl.requestFullscreen) docEl.requestFullscreen().catch(()=>{});
            else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen().catch(()=>{});
        }
        
        isAuthorizing = true;
        let techIndex = 0;

        circle.style.animation = "none";
        circle.style.opacity = "1";

        clearInterval(authInterval);
        authInterval = setInterval(() => {
            authProgress += 1.5;
            updateVisuals(authProgress);

            if (Math.floor(authProgress) % 8 === 0) {
                statusText.innerText = `Sincronizando nodo: [ ${techStack[techIndex % techStack.length]} ]...`;
                statusText.style.color = "#38bdf8";
                techIndex++;
            }

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
        circle.style.animation = "ringPulse 2s infinite ease-in-out";

        authInterval = setInterval(() => {
            authProgress -= 3;
            if (authProgress <= 0) {
                authProgress = 0;
                clearInterval(authInterval);
                statusText.innerText = "Sincronización interrumpida. Mantenga pulsado.";
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

// ========================================================
// SECUENCIA DE UNLOCK Y FETCH
// ========================================================
async function executeAISequence() {
    isProcessing = true;
    const btn = document.getElementById('auth-btn');
    const statusText = document.getElementById('ai-status-text');
    const circle = document.querySelector('.progress-ring__circle');
    const techMatrix = document.getElementById('tech-matrix');
    const authCard = document.getElementById('auth-card');

    btn.classList.add('processing');
    circle.style.stroke = "#10b981"; 
    techMatrix.style.color = "#10b981";
    techMatrix.style.textShadow = "0 0 25px #10b981";
    authCard.style.transform = "rotateX(0deg) rotateY(0deg) scale(0.95)";
    
    statusText.innerText = "Autorización completada. Enlazando API...";
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
                
                iniciarTelemetria3D();
            }, 800);
        }, 800);

    } catch (error) {
        statusText.innerText = "Error (Cold Start). Render despertando. Reintentando...";
        statusText.style.color = "#ef4444";
        circle.style.stroke = "#ef4444";
        setTimeout(() => { window.location.reload(); }, 4000);
    }
}

// ========================================================
// POBLAR DATOS DEL CV EN EL DOM
// ========================================================
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

// ========================================================
// TELEMETRÍA 3D GLOBE.GL Y MULTI-USUARIO - CORREGIDO
// ========================================================
async function iniciarTelemetria3D() {
    const telemetryContainer = document.getElementById('telemetry-data');
    const globeContainer = document.getElementById('globe-container');

    try {
        const res = await fetch(`${BASE_URL}/api/telemetry`);
        const myData = await res.json();

        // Actualizar datos de consola
        telemetryContainer.innerHTML = `
            <div style="color: #10b981; margin-bottom: 15px; font-weight: bold;">[ ENLACE ESTABLECIDO ]</div>
            <div><span style="color:#64748b">IP Client:</span> ${myData.ip_anonymized || myData.ip}</div>
            <div><span style="color:#64748b">ISP Node:</span> ${myData.isp}</div>
            <div><span style="color:#64748b">Location:</span> ${myData.city}, ${myData.country}</div>
            <div><span style="color:#64748b">Coords:</span> LAT ${myData.lat} / LON ${myData.lon}</div>
            <div style="margin-top: 15px; color: #f59e0b; font-size: 0.85rem;" class="blink">>>> Monitoreo SOC Multi-usuario Activo</div>
        `;

        // INSTANCIAR EL GLOBO CON MÉTODOS ESTÁNDAR COMPATIBLES
        const world = Globe()(globeContainer)
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
            .backgroundColor('#0f172a')
            .width(300)
            .height(300)
            .showAtmosphere(true)
            .atmosphereColor('#38bdf8'); // Eliminamos el método problemático alpha

        world.controls().autoRotate = true;
        world.controls().autoRotateSpeed = 2.5;
        world.pointOfView({ altitude: 2.3 });

        // Función para renderizar los marcadores de forma segura en el DOM
        function renderMarkers(usersList) {
            world.htmlElementsData(usersList)
                .htmlElement(d => {
                    const el = document.createElement('div');
                    const isMe = (d.ip_anonymized === myData.ip_anonymized);
                    const color = isMe ? '#10b981' : '#38bdf8'; 
                    
                    el.style.position = 'absolute';
                    el.style.transform = 'translate(-50%, -50%)';
                    el.style.zIndex = '9999';
                    el.style.pointerEvents = 'none';

                    el.innerHTML = `
                        <div style="width: ${isMe ? '24px' : '16px'}; height: ${isMe ? '24px' : '16px'}; background: radial-gradient(circle, ${color} 20%, transparent 70%); border-radius: 50%; animation: ringPulse 1.5s infinite ease-in-out;"></div>
                        <div style="width: ${isMe ? '8px' : '6px'}; height: ${isMe ? '8px' : '6px'}; background: ${color}; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 8px ${color};"></div>
                    `;
                    return el;
                });
        }

        // ESCUCHA FIREBASE TIEMPO REAL MULTI-USUARIO
        if (typeof firebase !== 'undefined' && dbFS) {
            dbFS.collection("active_users").onSnapshot((snapshot) => {
                const activeUsers = [];
                snapshot.forEach((doc) => {
                    const u = doc.data();
                    // Validamos que tenga coordenadas y que esté activo (últimos 10 min)
                    if (u.lat && u.lon && ((Date.now() / 1000) - u.timestamp < 600)) {
                        activeUsers.push(u);
                    }
                });
                
                // Si Firebase está vacío, nos aseguramos de pintar al menos tu nodo
                if (activeUsers.length === 0) {
                    activeUsers.push(myData);
                }
                
                renderMarkers(activeUsers);
            }, error => {
                console.warn("Error en snapshot de Firestore, usando modo local:", error);
                renderMarkers([myData]);
            });
        } else {
            renderMarkers([myData]);
        }

        // Zoom In dinámico al usuario principal
        setTimeout(() => {
            world.controls().autoRotate = false;
            world.pointOfView({ 
                lat: myData.lat, 
                lng: myData.lon, 
                altitude: 0.45 
            }, 2500);
        }, 3500);

    } catch (error) {
        console.error("Error en módulo 3D:", error);
        telemetryContainer.innerHTML = `<span style="color: #ef4444;">[ ERROR ]<br>Fallo en inicialización de entorno 3D.</span>`;
    }
}

// ========================================================
// DESCARGA DE PDF
// ========================================================
async function descargarCV() {
    const btn = document.getElementById('downloadBtn');
    btn.disabled = true;
    btn.innerHTML = '⏳ Procesando PDF en Python...';

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
        alert("Error de comunicación con el motor generador de FPDF.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '📥 Generar y Descargar PDF Oficial';
    }
}