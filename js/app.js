// ========================================================
// MÓDULO 2: DATOS, IA, TELEMETRÍA Y SISTEMA TERMINAL COMPLETO
// ========================================================
const BASE_URL = "https://anderson-cv-api.onrender.com";

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
let apiData = null;

// --------------------------------------------------------
// CAROUSEL DE IMÁGENES CON INTEGRACIÓN CDN DE CLOUD
// --------------------------------------------------------
let profileImages = ["img/foto1.png", "img/foto2.png"];
let currentImgIndex = 0;

function startProfileCarousel() {
    const imgEl = document.getElementById('profile-carousel');
    if (!imgEl || profileImages.length <= 1) return;
    
    setInterval(() => {
        imgEl.style.opacity = 0; 
        setTimeout(() => {
            currentImgIndex = (currentImgIndex + 1) % profileImages.length;
            imgEl.src = profileImages[currentImgIndex];
            imgEl.style.opacity = 1; 
        }, 400); 
    }, 5000); 
}

window.fetchPortfolioData = async function() { 
    try {
        const res = await fetch(`${BASE_URL}/api/cv-data`); 
        if (!res.ok) throw new Error("Fallo de comunicacion con Render API"); 
        apiData = await res.json(); 
        
        // Inyectar la foto remota de GitHub/Cloud al pool del carousel si esta disponible en Firestore
        if (apiData.info_personal && apiData.info_personal.url_foto) {
            profileImages[0] = apiData.info_personal.url_foto;
        }
        
        renderPortfolioData(); 
        startProfileCarousel(); 
    } catch (e) {
        console.error(">>> [ERR] Error descargando la matriz del CV: ", e);
    }
}

window.renderBars = function() { 
    document.querySelectorAll('.progress-fill').forEach(bar => { bar.style.width = `${bar.getAttribute('data-val')}%`; }); 
}

function typeWriter(elementId, text, speed = 20) {
    const el = document.getElementById(elementId); 
    if (!el) return;
    el.innerHTML = ''; 
    let i = 0;
    function type() { if (i < text.length) { el.innerHTML += text.charAt(i); i++; setTimeout(type, speed); } } 
    type();
}

function renderPortfolioData() {
    document.getElementById('web-nombre').innerText = apiData.info_personal.nombre;
    document.getElementById('web-titulo').innerText = apiData.info_personal.perfil_corto;
    typeWriter('web-resumen', apiData.info_personal.resumen);

    // Renderizado reactivo de Skills
    const skillCategories = ['desarrollo', 'infra'];
    skillCategories.forEach(cat => {
        const container = document.getElementById(`skills-${cat}`);
        if(container) container.innerHTML = '';
    });

    apiData.skills.forEach(s => { 
        const targetId = `skills-${s.category}`;
        const container = document.getElementById(targetId);
        if(container) {
            container.innerHTML += `<div class="skill-container"><div class="skill-name"><span>${s.name}</span><span>${s.percentage}%</span></div><div class="progress-bar"><div class="progress-fill" data-val="${s.percentage}"></div></div></div>`; 
        }
    });
    
    // Renderizado de Experiencias
    const expContainer = document.getElementById('experience-container');
    if (expContainer) {
        expContainer.innerHTML = '';
        apiData.experiencia.forEach(exp => {
            let liHtml = exp.detalles.map(d => `<li>${d}</li>`).join(''); 
            let tagsHtml = exp.tags ? exp.tags.map(t => `<span class="tag">${t}</span>`).join('') : '';
            expContainer.innerHTML += `<div class="timeline-item"><div class="timeline-header"><span>${exp.cargo}</span><span>${exp.fechas}</span></div><div class="timeline-company">${exp.empresa}</div><ul>${liHtml}</ul><div class="tag-container">${tagsHtml}</div></div>`;
        });
    }

    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });

    // Renderizado dinámico de la formación académica en la interfaz web
    const eduContainer = document.getElementById('education-container');
    if (eduContainer && apiData.estudios) {
        eduContainer.innerHTML = '';
        apiData.estudios.forEach(edu => {
            eduContainer.innerHTML += `
                <div class="timeline-item" style="margin-bottom: 12px; border-left: 2px solid #38bdf8; padding-left: 12px;">
                    <div class="timeline-header" style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; color: #ffffff;">
                        <span>${edu.titulo}</span>
                        <span style="color: #38bdf8;">${edu.año}</span>
                    </div>
                    <div class="timeline-company" style="color: #94a3b8; font-size: 13px; margin-top: 2px;">${edu.institucion}</div>
                </div>`;
        });
    }

    // Renderizado dinámico de Certificaciones y Diplomados desde Cloud Firestore
    const certContainer = document.getElementById('certifications-container');
    if (certContainer && apiData.certificaciones) {
        certContainer.innerHTML = '';
        apiData.certificaciones.forEach(cert => {
            certContainer.innerHTML += `
                <div class="certification-item" style="margin-bottom: 10px; display: flex; align-items: center; font-size: 13.5px; color: #e2e8f0;">
                    <span style="color: #38bdf8; margin-right: 10px;">✔</span>
                    <span>${cert}</span>
                </div>`;
        });
    }
}

// --------------------------------------------------------
// METRICAS DEVOPS PING
// --------------------------------------------------------
async function pingServer() {
    const badge = document.getElementById('server-metrics'); 
    if(!badge) return;
    const start = performance.now();
    try { 
        await fetch(`${BASE_URL}/`); 
        const latency = Math.round(performance.now() - start); 
        badge.classList.remove('offline'); 
        badge.innerHTML = `<span class="server-dot"></span> PING: ${latency}ms | 200 OK`; 
    } catch (e) { 
        badge.classList.add('offline'); 
        badge.innerHTML = `<span class="server-dot"></span> SERVER OFFLINE`; 
    }
}
setInterval(pingServer, 10000); setTimeout(pingServer, 2000); 

// --------------------------------------------------------
// TELEMETRÍA SOC & GLOBO TRIDIMENSIONAL (CORS FIXED)
// --------------------------------------------------------
window.iniciarTelemetria3D = async function() {
    const globeContainer = document.getElementById('globe-container'); 
    const telemetryContainer = document.getElementById('telemetry-data');
    if(!globeContainer || !telemetryContainer) return;

    try {
        const res = await fetch(`${BASE_URL}/api/telemetry`); 
        const myData = await res.json();
        
        telemetryContainer.innerHTML = `<div style="color: #10b981; margin-bottom: 12px; font-weight: bold;" class="terminal-font">[ ENLACE COMPLETO ]</div><div class="terminal-font"><span style="color:#64748b">IP:</span> ${myData.ip_anonymized || myData.ip}</div><div class="terminal-font"><span style="color:#64748b">Node:</span> ${myData.isp}</div><div class="terminal-font"><span style="color:#64748b">Loc:</span> ${myData.city}, ${myData.country}</div>`;
        
        const world = Globe()(globeContainer)
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
            .backgroundColor('#0f172a')
            .width(240)
            .height(240)
            .showAtmosphere(true)
            .atmosphereColor('#0ea5e9')
            .pointColor(d => d.isMe ? '#10b981' : '#38bdf8')
            .pointAltitude(0)
            .pointRadius(0.65)
            .pointsMerge(true);
            
        world.pointOfView({ lat: 0, lng: 0, altitude: 2.2 }, 0); 
        requestAnimationFrame(() => { if (world.controls() && world.controls().update) world.controls().update(); }); 
        world.controls().autoRotate = true; 
        world.controls().autoRotateSpeed = 1.5;
        
        // FIX DE CORRECCIÓN DE CORS: Carga síncrona del archivo local en lugar de llamadas externas redirigidas
        fetch('./assets/data/custom_countries.geojson')
            .then(r => {
                if (!r.ok) throw new Error("No se pudo mapear la telemetria vectorial local");
                return r.json();
            })
            .then(countries => { 
                world.polygonsData(countries.features)
                     .polygonCapColor(() => 'rgba(15, 23, 42, 0.6)')
                     .polygonSideColor(() => 'rgba(56, 189, 248, 0.15)') 
                     .polygonStrokeColor(() => 'rgba(56, 189, 248, 0.4)'); 
            }).catch(e => console.error("Error cargando polígonos locales GeoJSON: ", e));
            
        function updateWebGlPoints(uList) { 
            world.pointsData(uList.map(u => ({ lat: parseFloat(u.lat), lng: parseFloat(u.lon), isMe: u.ip_anonymized === myData.ip_anonymized }))); 
        }
        
        if (typeof firebase !== 'undefined' && dbFS) { 
            dbFS.collection("active_users").onSnapshot((s) => { 
                const au = []; 
                s.forEach((d) => { 
                    const u = d.data(); 
                    if (u.lat && u.lon && ((Date.now() / 1000) - u.timestamp < 600)) au.push(u); 
                }); 
                if (au.length === 0) au.push(myData); 
                updateWebGlPoints(au); 
            }, () => updateWebGlPoints([myData])); 
        } else { 
            updateWebGlPoints([myData]); 
        }
        
        setTimeout(() => { 
            if(world.controls()) world.controls().autoRotate = false; 
            world.pointOfView({ lat: myData.lat, lng: myData.lon, altitude: 0.6 }, 2500); 
        }, 3500);
    } catch (e) { 
        telemetryContainer.innerHTML = `<span style="color: #ef4444;" class="terminal-font">[ ERROR ] Módulo SOC caído.</span>`; 
    }
}

// --------------------------------------------------------
// LÓGICA DE ASISTENTE IA Y DESCARGA PDF
// --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const textOrig = downloadBtn.innerHTML; 
            downloadBtn.disabled = true; 
            downloadBtn.innerHTML = '⏳ Generando...';
            try { 
                const r = await fetch(`${BASE_URL}/descargar-cv`); 
                if(!r.ok) throw new Error("Error en descarga");
                const b = await r.blob(); 
                const a = document.createElement('a'); 
                a.href = window.URL.createObjectURL(b); 
                a.download = 'CV_Anderson_Moncada.pdf'; 
                a.click(); 
            } catch(e) {
                console.error("Fallo al bajar PDF: ", e);
            } finally { 
                downloadBtn.disabled = false; 
                downloadBtn.innerHTML = textOrig; 
            }
        });
    }

    const tOrb = document.getElementById('ai-trigger-orb'), 
          cBtn = document.getElementById('ai-close-btn'), 
          cWin = document.getElementById('ai-chat-window'), 
          fBox = document.getElementById('ai-chat-form'), 
          tTip = document.getElementById('ai-tooltip');
    
    const aiPhrases = ["¡Hola! ¿Quieres saber más sobre Anderson? 👋", "Pregúntame sobre su stack técnico. 🤖", "Conozco toda su experiencia en SOC. 🛡️", "¿Tienes dudas sobre su CV? Yo te ayudo. 💡"];
    let phraseIndex = 0;
    
    setInterval(() => {
        if (!cWin || cWin.style.display === 'flex') return;
        if(tTip) { 
            tTip.innerText = aiPhrases[phraseIndex % aiPhrases.length]; 
            phraseIndex++; 
            tTip.classList.add('show'); 
            
            if(window.playTone) {
                try { window.playTone(900, 'sine', 0.05, 0.01); } catch(audioErr){}
            }
            setTimeout(() => { tTip.classList.remove('show'); }, 4000); 
        }
    }, 12000);

    if (tOrb && cWin) {
        tOrb.addEventListener('click', () => { 
            try { if(window.playTone) window.playTone(600,'sine',0.1,0.02); } catch(e){}
            cWin.style.display = 'flex'; 
            tOrb.style.display = 'none'; 
            if(tTip) tTip.classList.remove('show'); 
            const uInput = document.getElementById('ai-user-input');
            if(uInput) uInput.focus();
        });
    }
    
    if (cBtn && tOrb && cWin) {
        cBtn.addEventListener('click', () => { 
            try { if(window.playTone) window.playTone(400,'sine',0.1,0.02); } catch(e){}
            cWin.style.display = 'none'; 
            tOrb.style.display = 'flex'; 
        });
    }
    
    if (fBox) fBox.addEventListener('submit', procesarPreguntaIA);
    
    document.querySelectorAll('.quick-prompt-btn').forEach(btn => { 
        btn.addEventListener('click', (e) => { 
            const uInput = document.getElementById('ai-user-input');
            if(uInput) {
                uInput.value = e.target.getAttribute('data-prompt'); 
                procesarPreguntaIA(new Event('submit')); 
            }
        }); 
    });
});

async function procesarPreguntaIA(e) {
    if (e) e.preventDefault(); 
    const inputF = document.getElementById('ai-user-input'), 
          sendB = document.getElementById('ai-send-btn'), 
          logs = document.getElementById('chat-logs');
    if(!inputF || !sendB || !logs) return;

    const msg = inputF.value.trim(); 
    if (!msg) return;
    
    try { if(window.playTone) window.playTone(800, 'square', 0.05, 0.02); } catch(e){}
    inputF.disabled = true; 
    sendB.disabled = true; 
    inputF.value = "";
    
    logs.innerHTML += `<div class="msg-user">${msg}</div>`; 
    logs.scrollTop = logs.scrollHeight;
    
    const lId = "load-"+Date.now(); 
    logs.innerHTML += `<div id="${lId}" class="msg-ai blink terminal-font"><span class="bot-tag">[ Jarvis ]:</span> Procesando NLP...</div>`; 
    logs.scrollTop = logs.scrollHeight;
    
    let typingInterval = null; 
    if(window.playTone) {
        try { typingInterval = setInterval(()=> window.playTone(600, 'triangle', 0.02, 0.01), 100); } catch(e){}
    }
    
    try {
        const r = await fetch(`${BASE_URL}/api/chat`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ message: msg }) 
        }); 
        
        if (r.status === 429) {
            if(typingInterval) clearInterval(typingInterval); 
            const loadEl = document.getElementById(lId);
            if(loadEl) loadEl.remove();
            logs.innerHTML += `<div class="msg-ai"><span class="bot-tag">[ Jarvis ]:</span> Mis núcleos de procesamiento han alcanzado el límite diario de consultas. 🔋<br><br>Por favor, regresa mañana para continuar la charla.</div>`;
            try { if(window.playTone) window.playTone(200, 'sawtooth', 0.5, 0.1); } catch(e){}
            inputF.disabled = false; sendB.disabled = false; 
            return;
        }
        
        if (!r.ok) throw new Error();
        const d = await r.json(); 
        
        if(typingInterval) clearInterval(typingInterval); 
        const loadEl = document.getElementById(lId);
        if(loadEl) loadEl.remove();
        
        logs.innerHTML += `<div class="msg-ai"><span class="bot-tag">[ Jarvis ]:</span> ${d.response}</div>`; 
        try { if(window.playTone) window.playTone(1000, 'sine', 0.1, 0.02); } catch(e){}
        setTimeout(() => { if(logs.lastElementChild) logs.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
    } catch (err) { 
        if(typingInterval) clearInterval(typingInterval); 
        const loadEl = document.getElementById(lId);
        if(loadEl) loadEl.remove();
        logs.innerHTML += `<div class="msg-system" style="color:#ef4444">Error cognitivo de enlace.</div>`; 
    }
    inputF.disabled = false; 
    sendB.disabled = false; 
    inputF.focus();
}

// --------------------------------------------------------
// EASTER EGG: TERMINAL DE SISTEMA Y JUEGOS
// --------------------------------------------------------
let keyBuffer = '';
const terminal = document.getElementById('hacker-terminal');
const termInput = document.getElementById('terminal-input');
const termOutput = document.getElementById('terminal-output');

let commandHistory = [];
let historyIndex = -1;

let terminalState = 'cmd'; 
let gameTarget = null;
let gameAttempts = 0;
let mathAnswer = 0;

const hackDictionary = ["LINUX", "CLOUD", "TOKEN", "PROXY", "VIRUS", "ADMIN", "CACHE", "MACRO"];
const trivia = [
    { q: "¿Qué puerto usa HTTPS por defecto?", a: "443" },
    { q: "¿En qué lenguaje está basado Android originalmente?", a: "java" },
    { q: "¿Qué herramienta usa contenedores para aislar apps?", a: "docker" },
    { q: "¿Qué significa el 'S' en HTTPS?", a: "secure" }
];
let currentTrivia = null;

let pongGame = null;
let snakeGame = null;

window.addEventListener('keydown', (e) => {
    if (terminal && terminal.style.display === 'flex') {
        const key = e.key.toLowerCase();
        
        if (terminalState === 'snake') {
            e.preventDefault();
            if (key === 'q' || key === 'escape') { quitSnake(); return; }
            if (snakeGame && !snakeGame.gameOver) {
                if ((key === 'arrowup' || key === 'w') && snakeGame.dy === 0) { snakeGame.dx = 0; snakeGame.dy = -1; }
                if ((key === 'arrowdown' || key === 's') && snakeGame.dy === 0) { snakeGame.dx = 0; snakeGame.dy = 1; }
                if ((key === 'arrowleft' || key === 'a') && snakeGame.dx === 0) { snakeGame.dx = -1; snakeGame.dy = 0; }
                if ((key === 'arrowright' || key === 'd') && snakeGame.dx === 0) { snakeGame.dx = 1; snakeGame.dy = 0; }
            }
            return;
        }

        if (terminalState === 'pong') {
            e.preventDefault();
            if (key === 'q' || key === 'escape') { quitPong(); return; }
            if (pongGame && !pongGame.gameOver) {
                if (key === 'arrowup' || key === 'w') { pongGame.up = true; }
                if (key === 'arrowdown' || key === 's') { pongGame.down = true; }
            }
            return;
        }

        if(e.key === 'Enter') { 
            procesarComandoTerminal(); 
        } else if (e.key === 'ArrowUp' && terminalState === 'cmd') { 
            e.preventDefault(); if (historyIndex > 0) { historyIndex--; termInput.value = commandHistory[historyIndex]; } 
        } else if (e.key === 'ArrowDown' && terminalState === 'cmd') { 
            e.preventDefault(); if (historyIndex < commandHistory.length - 1) { historyIndex++; termInput.value = commandHistory[historyIndex]; } else { historyIndex = commandHistory.length; termInput.value = ''; } 
        }
        if(termInput) termInput.focus(); 
        return;
    }

    if (document.activeElement.id === 'ai-user-input' || document.activeElement.id === 'terminal-input') return;
    
    keyBuffer += e.key.toLowerCase(); if (keyBuffer.length > 10) keyBuffer = keyBuffer.slice(-10);
    if (keyBuffer.includes('sudo') || keyBuffer.includes('admin')) {
        e.preventDefault(); 
        keyBuffer = ''; 
        try { if(window.playTone) window.playTone(1500, 'sawtooth', 0.5, 0.1); } catch(e){}
        
        if(termInput) termInput.value = ''; 
        if(terminal) {
            terminal.style.display = 'flex'; 
            setTimeout(() => { terminal.style.opacity = '1'; if(termInput) { termInput.value = ''; termInput.focus(); } }, 20);
            terminal.classList.add('glitch-anim'); 
            setTimeout(() => terminal.classList.remove('glitch-anim'), 400);
        }
    }
});

window.addEventListener('keyup', (e) => {
    if(terminalState === 'pong' && pongGame) {
        const key = e.key.toLowerCase();
        if (key === 'arrowup' || key === 'w') { pongGame.up = false; }
        if (key === 'arrowdown' || key === 's') { pongGame.down = false; }
    }
});

const closeTermBtn = document.getElementById('close-terminal-btn');
if(closeTermBtn) {
    closeTermBtn.addEventListener('click', () => { 
        if(terminalState === 'snake') quitSnake();
        if(terminalState === 'pong') quitPong();
        if(terminal) {
            terminal.style.opacity = '0'; 
            setTimeout(() => { terminal.style.display = 'none'; }, 300); 
        }
    });
}

function printTerminal(txt, color="#10b981", isHTML = false) {
    if(!termOutput) return;
    if(isHTML) { termOutput.innerHTML += `<div style="color:${color}; margin-bottom:4px;">${txt}</div>`; } 
    else { const div = document.createElement('div'); div.style.color = color; div.style.marginBottom = '4px'; div.textContent = txt; termOutput.appendChild(div); }
    termOutput.scrollTop = termOutput.scrollHeight;
}

function procesarComandoTerminal() {
    if(!termInput) return;
    const cmd = termInput.value.trim().toLowerCase(); termInput.value = ''; if (!cmd) return;
    
    if (terminalState === 'cmd') { commandHistory.push(cmd); historyIndex = commandHistory.length; }
    printTerminal(terminalState === 'cmd' ? `root@sys:~# ${cmd}` : `> ${cmd}`, "#fff");
    
    if (terminalState !== 'cmd' && (cmd === 'exit' || cmd === 'quit')) { terminalState = 'cmd'; printTerminal("Abortando. Volviendo a la terminal principal...", "#f59e0b"); return; }
    
    if (terminalState === 'guess') { playGuess(cmd); return; }
    if (terminalState === 'hack') { playHack(cmd); return; }
    if (terminalState === 'rps') { playRPS(cmd); return; }
    if (terminalState === 'quiz') { playQuiz(cmd); return; }
    if (terminalState === 'math') { playMath(cmd); return; }
    if (terminalState === '8ball') { play8Ball(cmd); return; }
    
    switch(cmd) {
        case 'help': 
            printTerminal("=== [ COMANDOS DE SISTEMA & CV ] ===", "#38bdf8");
            printTerminal("download_cv : Descarga la hoja de vida oficial en PDF");
            printTerminal("skills      : Muestra el nivel técnico de mi perfil desde Cloud");
            printTerminal("contact     : Muestra los protocolos oficiales de comunicación");
            printTerminal("neofetch    : Resumen del sistema AndersonOS");
            printTerminal("ping        : Prueba de latencia con servidor Backend API");
            printTerminal("whoami      : Muestra el usuario actual");
            printTerminal("date        : Muestra hora y fecha del servidor");
            printTerminal("clear       : Limpia el log de la terminal");
            printTerminal("exit        : Cierra la sesión segura");
            printTerminal("\n> Escribe 'games' para ver el módulo de entretenimiento.", "#10b981");
            break;
            
        case 'games':
            printTerminal("=== [ MÓDULO DE ENTRETENIMIENTO ] ===", "#f59e0b");
            printTerminal("snake       : Jugar al clásico Snake (Canvas 2D)");
            printTerminal("pong        : Ping-Pong VS Inteligencia Artificial (Canvas 2D)");
            printTerminal("hack        : Minijuego de desencriptación (Estilo Fallout)");
            printTerminal("guess       : Adivina el hash numérico oculto (1-100)");
            printTerminal("rps         : Piedra, Papel o Tijera vs Sistema");
            printTerminal("quiz        : Trivia de programación y sistemas");
            printTerminal("math        : Desafío de cálculo mental rápido");
            printTerminal("slot        : Máquina tragamonedas del casino SOC");
            printTerminal("8ball       : Pregúntale a la Bola 8 mágica");
            printTerminal("matrix      : Despliega cascada visual de código");
            printTerminal("joke        : Chistes exclusivos de desarrolladores");
            break;

        case 'snake': startSnake(); break;
        case 'pong': startPong(); break;
        
        case 'hack':
            terminalState = 'hack'; gameAttempts = 4;
            let shuffled = hackDictionary.sort(() => 0.5 - Math.random()); let options = shuffled.slice(0, 5);
            gameTarget = options[Math.floor(Math.random() * options.length)];
            printTerminal("=== BYPASS DE SEGURIDAD ===", "#38bdf8");
            printTerminal(`Tienes ${gameAttempts} intentos. Opciones: ${options.join(' | ')}`, "#f59e0b");
            break;
            
        case 'guess': 
            terminalState = 'guess'; gameTarget = Math.floor(Math.random() * 100) + 1; gameAttempts = 7; 
            printTerminal("=== ANALIZADOR DE HASH ===", "#38bdf8"); 
            printTerminal(`Adivina el número del 1 al 100. Tienes ${gameAttempts} intentos. Escribe 'exit' para salir.`); 
            break;
            
        case 'rps': 
            terminalState = 'rps'; 
            printTerminal("=== PIEDRA, PAPEL O TIJERA ===", "#38bdf8"); 
            printTerminal("Escribe 'piedra', 'papel' o 'tijera' (o 'exit')."); 
            break;
            
        case 'quiz': 
            terminalState = 'quiz'; currentTrivia = trivia[Math.floor(Math.random() * trivia.length)]; 
            printTerminal("=== TRIVIA TECH ===", "#38bdf8"); printTerminal(currentTrivia.q); 
            break;
            
        case 'math': 
            terminalState = 'math'; let a = Math.floor(Math.random() * 12)+2; let b = Math.floor(Math.random() * 12)+2; mathAnswer = a * b; 
            printTerminal("=== RETO MATEMÁTICO ===", "#38bdf8"); printTerminal(`Calcula rápidamente: ¿Cuánto es ${a} x ${b}?`); 
            break;

        case '8ball':
            terminalState = '8ball';
            printTerminal("=== BOLA 8 DE LA IA ===", "#38bdf8");
            printTerminal("Hazme una pregunta de sí o no y te diré el futuro.");
            break;

        case 'slot':
            const slots = ['🍎', '🍋', '🍒', '💎', '7️⃣'];
            const r1 = slots[Math.floor(Math.random() * slots.length)];
            const r2 = slots[Math.floor(Math.random() * slots.length)];
            const r3 = slots[Math.floor(Math.random() * slots.length)];
            printTerminal("=== SOC CASINO ===", "#38bdf8");
            printTerminal(`[ ${r1} | ${r2} | ${r3} ]`, "#fff");
            if(r1 === r2 && r2 === r3) {
                try { if(window.playTone) window.playTone(1000, 'square', 0.5, 0.1); } catch(e){}
                printTerminal("¡JACKPOT! Has ganado el respeto del servidor.", "#10b981");
            } else { printTerminal("Sigue intentando...", "#ef4444"); }
            break;

        case 'joke': 
            const jokes = ["Hay 10 tipos de personas: las que saben binario y las que no.", "¿Por qué los programadores prefieren el modo oscuro? Porque la luz atrae a los bugs.", "Mi código no tiene bugs, solo desarrolla features inesperadas.", "Un SQL entra a un bar, se acerca a dos tablas y pregunta: '¿Puedo unirme?'"]; 
            printTerminal(jokes[Math.floor(Math.random() * jokes.length)], "#f59e0b"); 
            break;

        case 'matrix':
            printTerminal("Inicializando cascada...", "#f59e0b"); let matrixCount = 0;
            const matrixInt = setInterval(() => { let chars = ''; for(let i=0; i<40; i++) chars += String.fromCharCode(33 + Math.random()*90); printTerminal(chars, "#10b981"); matrixCount++; if(matrixCount > 15) { clearInterval(matrixInt); printTerminal("Cascada completada.", "#38bdf8"); } }, 100);
            break;

        case 'download_cv': 
            printTerminal("Extrayendo payload desde servidor... Iniciando descarga.", "#10b981"); 
            const dBtn = document.getElementById('downloadBtn');
            if(dBtn) dBtn.click(); 
            break;
            
        case 'skills': 
            printTerminal("=== MATRIZ DE SKILLS (REAL-TIME CLOUD) ===", "#38bdf8");
            if (apiData && apiData.skills) {
                apiData.skills.forEach(s => {
                    const totalBlocks = 10;
                    const activeBlocks = Math.round((s.percentage / 100) * totalBlocks);
                    const barStr = "■".repeat(activeBlocks) + "□".repeat(totalBlocks - activeBlocks);
                    printTerminal(`[ ${s.name.padEnd(30, ' ')} ] ${barStr} ${s.percentage}%`);
                });
            } else {
                printTerminal("[ KOTLIN ] ■■■■■■■■■□ 90%"); printTerminal("[ PYTHON ] ■■■■■■■■□□ 85%"); printTerminal("[ DOCKER ] ■■■■■■■■■□ 88%"); printTerminal("[ IS0 27k] ■■■■■■■■□□ 85%"); 
            }
            break;
            
        case 'contact': 
            printTerminal("=== PROTOCOLOS DE COMUNICACIÓN ===", "#38bdf8"); 
            if (apiData && apiData.info_personal && apiData.links_oficiales) {
                printTerminal(`Email    : ${apiData.info_personal.email}`);
                printTerminal(`Celular  : ${apiData.info_personal.telefono}`);
                printTerminal(`LinkedIn : ${apiData.links_oficiales.linkedin}`);
                printTerminal(`GitHub   : ${apiData.links_oficiales.github}`);
            } else {
                printTerminal("LinkedIn : linkedin.com/in/andersonmoncada"); printTerminal("Email    : anderson.mmoncada@gmail.com");
            }
            break;
            
        case 'date': printTerminal(new Date().toString(), "#38bdf8"); break;
        case 'whoami': printTerminal(`${apiData?.info_personal?.nombre || "Anderson Moncada"}. Ingeniero DevOps & Ciberseguridad. Nivel de acceso: ROOT.`); break;
        case 'neofetch': printTerminal(`<pre style="line-height:1.2;">\n   .---.      <span style="color:#fff">OS:</span> AndersonOS v4.0 (Cloud Native)\n  /     \\     <span style="color:#fff">Kernel:</span> 6.1.0-security-soc\n  \\.@-@./     <span style="color:#fff">Uptime:</span> 24/7\n  /\`\\_/\`\\     <span style="color:#fff">Packages:</span> 1337 (firestore-linked)\n //  _  \\\\    <span style="color:#fff">Shell:</span> zsh 5.9\n| \\     )|_   <span style="color:#fff">Resolution:</span> 1920x1080\n/\`\\_\`>  <_\/ \\ <span style="color:#fff">CPU:</span> Neural Engine Core Pool\n\\__/'---'\\__/ <span style="color:#fff">Memory:</span> 32GB / 64GB\n            </pre>`, "#38bdf8", true); break;
        case 'clear': if(termOutput) termOutput.innerHTML = '<div>Anderson OS v4.0.0 (tty1)</div><div>Ejecuta \'help\' para ver comandos.</div>'; break;
        case 'exit': if(terminal) { terminal.style.opacity = '0'; setTimeout(() => { terminal.style.display = 'none'; }, 300); } break;
        case 'ping': printTerminal("Haciendo ping a Render API..."); const startT = performance.now(); fetch(`${BASE_URL}/`).then(() => { const lat = Math.round(performance.now() - startT); printTerminal(`64 bytes from API: icmp_seq=1 time=${lat}ms`); pingServer(); }).catch(() => { printTerminal(`Destination Host Unreachable`, "#ef4444"); }); break;
        
        default: printTerminal(`bash: ${cmd}: command not found`, "#ef4444");
    }
}

// ========================================================
// LOGICA DE MINIJUEGOS DE TEXTO
// ========================================================
function playGuess(cmd) {
    const num = parseInt(cmd); if (isNaN(num)) { printTerminal("Ingresa un número válido.", "#ef4444"); return; }
    gameAttempts--;
    if (num === gameTarget) { try { if(window.playTone) window.playTone(800, 'square', 0.2, 0.1); } catch(e){} printTerminal(`¡CORRECTO! El número era ${gameTarget}.`, "#10b981"); terminalState = 'cmd'; } 
    else if (gameAttempts <= 0) { try { if(window.playTone) window.playTone(200, 'sawtooth', 0.5, 0.1); } catch(e){} printTerminal(`¡BLOQUEADO! Te quedaste sin intentos. Era ${gameTarget}.`, "#ef4444"); terminalState = 'cmd'; } 
    else if (num < gameTarget) { printTerminal(`Más alto... (Intentos: ${gameAttempts})`, "#f59e0b"); } 
    else { printTerminal(`Más bajo... (Intentos: ${gameAttempts})`, "#f59e0b"); }
}

function playHack(cmd) {
    cmd = cmd.toUpperCase();
    if(cmd === gameTarget) { try { if(window.playTone) window.playTone(800, 'square', 0.3, 0.1); } catch(e){} printTerminal("¡CONTRASEÑA ACEPTADA!", "#10b981"); terminalState = 'cmd'; return; }
    gameAttempts--;
    if(gameAttempts <= 0) { try { if(window.playTone) window.playTone(200, 'sawtooth', 0.5, 0.1); } catch(e){} printTerminal(`BLOQUEO. La correcta era ${gameTarget}.`, "#ef4444"); terminalState = 'cmd'; return; }
    let matches = 0; for(let i=0; i < Math.min(cmd.length, gameTarget.length); i++) { if(cmd[i] === gameTarget[i]) matches++; }
    printTerminal(`Denegada. Coincidencias: ${matches}/${gameTarget.length}. Intentos: ${gameAttempts}`, "#f59e0b");
}

function playRPS(cmd) {
    const valid = ['piedra', 'papel', 'tijera']; if (!valid.includes(cmd)) { printTerminal("Usa 'piedra', 'papel' o 'tijera'.", "#ef4444"); return; }
    const iaMove = valid[Math.floor(Math.random() * valid.length)]; printTerminal(`IA eligió: ${iaMove}`, "#38bdf8");
    if (cmd === iaMove) printTerminal("EMPATE.", "#f59e0b"); 
    else if ( (cmd === 'piedra' && iaMove === 'tijera') || (cmd === 'papel' && iaMove === 'piedra') || (cmd === 'tijera' && iaMove === 'papel') ) { try { if(window.playTone) window.playTone(800, 'square', 0.2, 0.1); } catch(e){} printTerminal("¡GANASTE!", "#10b981"); } 
    else printTerminal("PERDISTE.", "#ef4444");
}

function playQuiz(cmd) {
    if(cmd.includes(currentTrivia.a)) { try { if(window.playTone) window.playTone(800, 'square', 0.2, 0.1); } catch(e){} printTerminal("¡CORRECTO!", "#10b981"); terminalState = 'cmd'; }
    else { printTerminal(`Incorrecto. La respuesta era: ${currentTrivia.a}.`, "#ef4444"); terminalState = 'cmd'; }
}

function playMath(cmd) {
    if(parseInt(cmd) === mathAnswer) { try { if(window.playTone) window.playTone(800, 'square', 0.2, 0.1); } catch(e){} printTerminal("¡CORRECTO!", "#10b981"); }
    else { printTerminal(`Incorrecto. Era ${mathAnswer}.`, "#ef4444"); } terminalState = 'cmd';
}

function play8Ball(cmd) {
    const answers = ["Sí.", "Es cierto.", "Definitivamente.", "Perspectiva buena.", "Lo más probable.", "Vuelve a preguntar.", "Concéntrate y pregunta de nuevo.", "No cuentes con ello.", "Mi respuesta es no.", "Muy dudoso."];
    printTerminal(`🎱 Bola 8 dice: ${answers[Math.floor(Math.random() * answers.length)]}`, "#38bdf8");
}

// ========================================================
// MOTOR DE JUEGOS HTML5 CANVAS (SNAKE Y PONG)
// ========================================================
function startPong() {
    if(!termOutput) return;
    terminalState = 'pong'; termOutput.innerHTML = '';
    printTerminal("=== PONG VS KERNEL AI ===", "#38bdf8"); printTerminal("Controles: W (Arriba) / S (Abajo) o Flechas. Presiona 'Q' para salir.", "#f59e0b");
    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 240; canvas.style.border = "2px solid #38bdf8"; canvas.style.marginTop = "15px"; canvas.style.display = "block"; canvas.style.backgroundColor = "#020617";
    termOutput.appendChild(canvas); const ctx = canvas.getContext('2d'); if(termInput) termInput.disabled = true; 
    pongGame = { ctx, canvas, player: { y: 100, score: 0 }, ai: { y: 100, score: 0 }, ball: { x: 200, y: 120, dx: 4, dy: 4 }, up: false, down: false, gameOver: false, interval: setInterval(updatePong, 30) };
}

function updatePong() {
    const pg = pongGame; if(!pg || pg.gameOver) return;
    if(pg.up && pg.player.y > 0) pg.player.y -= 6; if(pg.down && pg.player.y < 200) pg.player.y += 6;
    const aiSpeed = 3.5; if(pg.ball.y < pg.ai.y + 20) pg.ai.y -= aiSpeed; else if(pg.ball.y > pg.ai.y + 20) pg.ai.y += aiSpeed;
    if(pg.ai.y < 0) pg.ai.y = 0; if(pg.ai.y > 200) pg.ai.y = 200;
    pg.ball.x += pg.ball.dx; pg.ball.y += pg.ball.dy;
    if(pg.ball.y <= 0 || pg.ball.y >= 235) { pg.ball.dy *= -1; if(window.playTone) { try { window.playTone(400, 'sine', 0.05, 0.02); } catch(e){} } }
    if(pg.ball.x <= 15 && pg.ball.x >= 5 && pg.ball.y >= pg.player.y && pg.ball.y <= pg.player.y + 40) { pg.ball.dx *= -1; pg.ball.x = 16; if(window.playTone) { try { window.playTone(800, 'square', 0.05, 0.05); } catch(e){} } }
    if(pg.ball.x >= 380 && pg.ball.x <= 390 && pg.ball.y >= pg.ai.y && pg.ball.y <= pg.ai.y + 40) { pg.ball.dx *= -1; pg.ball.x = 379; if(window.playTone) { try { window.playTone(800, 'square', 0.05, 0.05); } catch(e){} } }
    if(pg.ball.x < 0) { pg.ai.score++; resetPongBall(); } if(pg.ball.x > 400) { pg.player.score++; resetPongBall(); }
    if(pg.player.score >= 5 || pg.ai.score >= 5) {
        pg.gameOver = true; clearInterval(pg.interval); pg.ctx.fillStyle = 'rgba(0,0,0,0.7)'; pg.ctx.fillRect(0,0, 400, 240);
        pg.ctx.fillStyle = pg.player.score >= 5 ? '#10b981' : '#ef4444'; pg.ctx.font = 'bold 20px "JetBrains Mono", monospace';
        pg.ctx.fillText(pg.player.score >= 5 ? `¡GANASTE!` : `¡PERDISTE!`, 150, 110);
        pg.ctx.fillStyle = '#fff'; pg.ctx.font = '14px "JetBrains Mono", monospace'; pg.ctx.fillText(`Tú: ${pg.player.score} - IA: ${pg.ai.score}`, 145, 140);
        printTerminal("Fin de la partida. Presiona 'Q' para regresar.", "#ef4444");
    }
    if(!pg.gameOver) { pg.ctx.fillStyle = '#020617'; pg.ctx.fillRect(0, 0, 400, 240); pg.ctx.setLineDash([5, 15]); pg.ctx.beginPath(); pg.ctx.moveTo(200, 0); pg.ctx.lineTo(200, 240); pg.ctx.strokeStyle = "rgba(255,255,255,0.2)"; pg.ctx.stroke(); pg.ctx.fillStyle = '#38bdf8'; pg.ctx.fillRect(pg.ball.x, pg.ball.y, 6, 6); pg.ctx.fillStyle = '#10b981'; pg.ctx.fillRect(10, pg.player.y, 5, 40); pg.ctx.fillStyle = '#ef4444'; pg.ctx.fillRect(385, pg.ai.y, 5, 40); pg.ctx.fillStyle = '#fff'; pg.ctx.font = 'bold 24px monospace'; pg.ctx.fillText(pg.player.score, 100, 30); pg.ctx.fillText(pg.ai.score, 280, 30); }
}

function resetPongBall() { if(pongGame) { pongGame.ball.x = 200; pongGame.ball.y = 120; pongGame.ball.dx = (Math.random() > 0.5 ? 4 : -4); pongGame.ball.dy = (Math.random() > 0.5 ? 4 : -4); if(window.playTone) { try { window.playTone(200, 'sawtooth', 0.2, 0.05); } catch(e){} } } }
function quitPong() { if(pongGame) clearInterval(pongGame.interval); if(termInput) termInput.disabled = false; if(termInput) termInput.focus(); terminalState = 'cmd'; printTerminal(`Saliendo del juego...`, "#38bdf8"); pongGame = null; }

function startSnake() {
    if(!termOutput) return;
    terminalState = 'snake'; termOutput.innerHTML = '';
    printTerminal("=== SNAKE PROTOCOL ===", "#38bdf8"); printTerminal("Controles: Flechas o W A S D. Presiona 'Q' para salir.", "#f59e0b");
    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 240; canvas.style.border = "2px solid #10b981"; canvas.style.marginTop = "15px"; canvas.style.display = "block"; canvas.style.backgroundColor = "#020617";
    termOutput.appendChild(canvas); const ctx = canvas.getContext('2d'); const gridSize = 20; let snake = [{x: 10, y: 10}]; let food = {x: 15, y: 5}; let dx = 1, dy = 0; let score = 0; let gameOver = false;
    if(termInput) termInput.disabled = true; snakeGame = { ctx, canvas, gridSize, snake, food, dx, dy, score, gameOver, interval: setInterval(updateSnake, 120) };
}

function updateSnake() {
    const sg = snakeGame; if(!sg || sg.gameOver) return;
    const head = {x: sg.snake[0].x + sg.dx, y: sg.snake[0].y + sg.dy};
    if(head.x < 0 || head.x >= sg.canvas.width/sg.gridSize || head.y < 0 || head.y >= sg.canvas.height/sg.gridSize) { return triggerGameOver(); }
    for(let part of sg.snake) { if(head.x === part.x && head.y === part.y) return triggerGameOver(); }
    sg.snake.unshift(head);
    if(head.x === sg.food.x && head.y === sg.food.y) { sg.score += 10; sg.food = { x: Math.floor(Math.random() * (sg.canvas.width/sg.gridSize)), y: Math.floor(Math.random() * (sg.canvas.height/sg.gridSize)) }; if(window.playTone) { try { window.playTone(800, 'sine', 0.1, 0.05); } catch(e){} } } 
    else { sg.snake.pop(); }
    sg.ctx.fillStyle = '#020617'; sg.ctx.fillRect(0, 0, sg.canvas.width, sg.canvas.height); sg.ctx.fillStyle = '#ef4444'; sg.ctx.fillRect(sg.food.x * sg.gridSize, sg.food.y * sg.gridSize, sg.gridSize - 1, sg.gridSize - 1); sg.ctx.fillStyle = '#10b981'; for(let part of sg.snake) { sg.ctx.fillRect(part.x * sg.gridSize, part.y * sg.gridSize, sg.gridSize - 1, sg.gridSize - 1); } sg.ctx.fillStyle = '#fff'; sg.ctx.font = '14px "JetBrains Mono", monospace'; sg.ctx.fillText(`Score: ${sg.score}`, 10, 20);
}

function triggerGameOver() {
    if(!snakeGame) return;
    snakeGame.gameOver = true; clearInterval(snakeGame.interval); if(window.playTone) { try { window.playTone(200, 'sawtooth', 0.5, 0.1); } catch(e){} }
    snakeGame.ctx.fillStyle = 'rgba(0,0,0,0.7)'; snakeGame.ctx.fillRect(0,0, snakeGame.canvas.width, snakeGame.canvas.height);
    snakeGame.ctx.fillStyle = '#ef4444'; snakeGame.ctx.font = 'bold 20px "JetBrains Mono", monospace'; snakeGame.ctx.fillText(`GAME OVER`, 140, 110);
    snakeGame.ctx.fillStyle = '#fff'; snakeGame.ctx.font = '14px "JetBrains Mono", monospace'; snakeGame.ctx.fillText(`Final Score: ${snakeGame.score}`, 135, 140);
    printTerminal("Fin del juego. Presiona 'Q' para regresar.", "#ef4444");
}

function quitSnake() {
    if(snakeGame) clearInterval(snakeGame.interval); if(termInput) termInput.disabled = false; if(termInput) termInput.focus(); terminalState = 'cmd';
    printTerminal(`Saliendo... Puntuación: ${snakeGame ? snakeGame.score : 0}`, "#38bdf8"); snakeGame = null;
}