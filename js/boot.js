// ========================================================
// MÓDULO 1: ARRANQUE NEURONAL Y SOUND UX
// ========================================================

window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.audioCtx = null;
window.isMuted = false;

window.playTone = function(freq, type, duration, vol) {
    if (window.isMuted) return;
    if (!window.audioCtx) window.audioCtx = new window.AudioContext();
    if (window.audioCtx.state === 'suspended') window.audioCtx.resume();
    
    const osc = window.audioCtx.createOscillator();
    const gain = window.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, window.audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, window.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, window.audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(window.audioCtx.destination);
    osc.start(); osc.stop(window.audioCtx.currentTime + duration);
}

document.addEventListener('DOMContentLoaded', () => {
    const soundBtn = document.getElementById('sound-toggle');
    const iconOn = document.getElementById('sound-icon-on');
    const iconOff = document.getElementById('sound-icon-off');
    
    soundBtn.addEventListener('click', () => {
        window.isMuted = !window.isMuted;
        iconOn.style.display = window.isMuted ? 'none' : 'block';
        iconOff.style.display = window.isMuted ? 'block' : 'none';
    });

    // FIX DEL SONIDO: Evento 'mouseenter' delegado. Solo suena 1 vez al entrar.
    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.interactive-element');
        if (target && !target.dataset.hovered) {
            target.dataset.hovered = 'true';
            window.playTone(800, 'sine', 0.05, 0.02);
            
            // Cuando el mouse salga de la tarjeta, permitimos que vuelva a sonar en el futuro
            target.addEventListener('mouseleave', () => {
                target.dataset.hovered = '';
            }, { once: true });
        }
    });

    initHoldToUnlock();
    startRandomMatrix();
    initParallaxBackground();
});

let isProcessing = false;
const compilingStates = ["Verificando kernel...", "Desplegando microservicios...", "Configurando Docker...", "Aplicando ISO 27001...", "Enrutando SOC..."];
const techKeywords = ["KOTLIN", "PYTHON", "DOCKER", "FASTAPI", "SOC", "FIREBASE", "LINUX", "BASH"];
let matrixInterval;

function spawnMatrixWord() {
    const bgContainer = document.getElementById('tech-matrix-bg');
    if (!bgContainer) return;
    const span = document.createElement('span');
    span.className = 'matrix-item';
    span.innerText = techKeywords[Math.floor(Math.random() * techKeywords.length)];
    span.style.left = `${Math.random() * 80 + 5}%`;
    span.style.top = `${Math.random() * 80 + 5}%`;
    span.style.fontSize = `${Math.random() * 1.5 + 1.5}rem`;
    bgContainer.appendChild(span);
    setTimeout(() => { if(span.parentNode) span.remove(); }, 3000);
}

function startRandomMatrix() {
    for(let i=0; i<5; i++) setTimeout(spawnMatrixWord, i*200);
    matrixInterval = setInterval(spawnMatrixWord, 450);
}

function initParallaxBackground() {
    const bgContainer = document.getElementById('tech-matrix-bg');
    if (!bgContainer) return;
    window.addEventListener('mousemove', (e) => {
        if (isProcessing) return;
        bgContainer.style.transform = `translate(${-(e.clientX - window.innerWidth/2)*0.04}px, ${-(e.clientY - window.innerHeight/2)*0.04}px)`;
    });
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
            if (isProcessing || !e.gamma || !e.beta) return;
            let g = Math.max(-35, Math.min(35, e.gamma)), b = Math.max(-35, Math.min(35, e.beta));
            bgContainer.style.transform = `translate(${-g*1.5}px, ${-b*1.5}px)`;
        });
    }
}

function initHoldToUnlock() {
    const btn = document.getElementById('auth-btn');
    const container = document.getElementById('auth-card');
    const statusText = document.getElementById('ai-status-text');
    const percentText = document.getElementById('auth-percent-text');
    const circle = document.getElementById('btn-progress-fill');
    
    circle.style.strokeDashoffset = 352;
    let authProgress = 0, authInterval, stateIndex = 0;

    window.addEventListener('mousemove', (e) => {
        if (!isProcessing) container.style.transform = `rotateY(${(window.innerWidth/2 - e.pageX)/45}deg) rotateX(${(window.innerHeight/2 - e.pageY)/45}deg)`;
    });

    function startAuth(e) {
        if (isProcessing || (e.type === 'mousedown' && e.button !== 0)) return; 
        if (!window.audioCtx) window.audioCtx = new window.AudioContext();
        if (window.audioCtx.state === 'suspended') window.audioCtx.resume();
        window.playTone(300, 'square', 0.2, 0.05); 

        container.classList.add('processing');
        clearInterval(authInterval);
        
        authInterval = setInterval(() => {
            authProgress += 1.3; 
            circle.style.strokeDashoffset = 352 - (authProgress/100)*352;
            percentText.innerText = `${Math.floor(authProgress)}%`;

            if(Math.floor(authProgress)%5 === 0) window.playTone(600 + authProgress*5, 'sine', 0.03, 0.01);

            if (Math.floor(authProgress)%15 === 0) {
                statusText.innerText = compilingStates[stateIndex % compilingStates.length];
                statusText.style.color = "#10b981"; stateIndex++;
            }
            if (authProgress >= 100) { clearInterval(authInterval); executeBootSequence(); }
        }, 30);
    }

    function stopAuth() {
        if (isProcessing) return;
        container.classList.remove('processing');
        clearInterval(authInterval);
        authInterval = setInterval(() => {
            authProgress -= 4;
            if (authProgress <= 0) {
                authProgress = 0; clearInterval(authInterval);
                statusText.innerText = "Esperando confirmación..."; statusText.style.color = "#38bdf8";
                percentText.innerText = "HOLD"; stateIndex = 0;
            }
            circle.style.strokeDashoffset = 352 - (authProgress/100)*352;
            percentText.innerText = `${Math.floor(authProgress)}%`;
        }, 20);
    }

    btn.addEventListener('mousedown', startAuth); btn.addEventListener('touchstart', startAuth, {passive: true});
    window.addEventListener('mouseup', stopAuth); window.addEventListener('touchend', stopAuth);
}

async function executeBootSequence() {
    isProcessing = true;
    document.getElementById('ai-status-text').innerText = "ENTORNO COMPILADO.";
    document.getElementById('auth-percent-text').innerHTML = "OK";
    clearInterval(matrixInterval);
    
    window.playTone(800, 'square', 0.1, 0.05);
    setTimeout(()=> window.playTone(1200, 'square', 0.3, 0.05), 150);

    try {
        await window.fetchPortfolioData();
        setTimeout(() => {
            const bootScreen = document.getElementById('ai-boot-screen');
            bootScreen.style.transform = 'scale(1.1)'; bootScreen.style.opacity = '0';
            setTimeout(() => {
                bootScreen.style.display = 'none';
                document.getElementById('main-portfolio').style.display = 'block';
                const aiWidget = document.getElementById('ai-floating-assistant');
                aiWidget.style.display = 'block';
                setTimeout(() => { aiWidget.style.opacity = '1'; aiWidget.style.transform = 'translateY(0)'; aiWidget.style.pointerEvents = 'all'; }, 100);
                window.renderBars(); window.iniciarTelemetria3D();
            }, 800);
        }, 800);
    } catch (e) { setTimeout(() => window.location.reload(), 3000); }
}