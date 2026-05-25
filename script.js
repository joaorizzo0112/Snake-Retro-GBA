const canvas = document.getElementById("snakeGame");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("highScore");
const levelTextDisplay = document.getElementById("levelText");

const overlay = document.getElementById("overlay");
const tutorialScreen = document.getElementById("tutorialScreen");
const statusText = document.getElementById("statusText");
const instructionText = document.getElementById("instructionText");
const modeSelector = document.getElementById("modeSelector");
const currentModeText = document.getElementById("currentModeText");
const menuButtonsContainer = document.getElementById("menuButtons");
const btnStart = document.getElementById("startBtn");
const btnTutorial = document.getElementById("btnTutorial");
const soundIcon = document.getElementById("soundIcon");
const scoreboardPanel = document.querySelector(".retro-scoreboard"); 

const box = 20; 
let snake, food, direction, score, gameInterval;
let speed = 150; 
let changingDirection = false;
let levelIndex = 0;
let soundEnabled = true;
let isPaused = false; 

const MODES = ["CLÁSSICO", "PORTAL", "BÓNUS"];
let selectedModeIndex = 0;
let currentScreen = 'START'; 
let selectedMenuItem = 0; 
let bonusFood = null;
let bonusTimer = null;
let ateFood = false;

const levelNames = [
    "WORM", "SNAKE", "VIPER", "COBRA", "PYTHON", 
    "MAMBA", "ANACONDA", "HYDRA", "BASILISK", "LEVIATHAN", 
    "DRAGON", "SHENRON", "QUETZAL", "JORMUN", "TITAN"
];

const palettes = [
    { name: "CLASSIC", bg: "#2c3329", bezel: "#879782", screen: "#8bac0f", dark: "#0f380f", shadow: "#1f2a17", screenRGB: "139, 172, 15", darkRGB: "15, 56, 15" },
    { name: "POCKET", bg: "#111111", bezel: "#c4c4cc", screen: "#dfdfdf", dark: "#111111", shadow: "#555555", screenRGB: "223, 223, 223", darkRGB: "17, 17, 17" },
    { name: "LIGHT", bg: "#1a252c", bezel: "#76848d", screen: "#00c3a5", dark: "#00332b", shadow: "#001a15", screenRGB: "0, 195, 165", darkRGB: "0, 51, 43" },
    { name: "VIRTUAL", bg: "#5C1111", bezel: "#B22222", screen: "#050000", dark: "#ff0000", shadow: "#4A0E0E", screenRGB: "5, 0, 0", darkRGB: "255, 0, 0" }
];

let currentPalette = 0;
let cScreen = palettes[0].screen, cDark = palettes[0].dark;
let cScreenRGB = palettes[0].screenRGB, cDarkRGB = palettes[0].darkRGB;

function changePalette() {
    desbloquearAudio();
    currentPalette = (currentPalette + 1) % palettes.length;
    const p = palettes[currentPalette];
    
    document.documentElement.style.setProperty('--retro-bg', p.bg);
    document.documentElement.style.setProperty('--retro-bezel', p.bezel);
    document.documentElement.style.setProperty('--retro-screen', p.screen);
    document.documentElement.style.setProperty('--retro-dark', p.dark);
    document.documentElement.style.setProperty('--retro-shadow', p.shadow);
    
    cScreen = p.screen; cDark = p.dark;
    cScreenRGB = p.screenRGB; cDarkRGB = p.darkRGB;

    if (currentScreen !== 'PLAYING') overlay.style.background = currentScreen === 'START' ? "transparent" : `rgba(${cScreenRGB}, 0.95)`;
    tutorialScreen.style.background = `rgba(${cScreenRGB}, 0.95)`;
    
    if (currentScreen === 'START') {
        statusText.innerText = p.name;
        statusText.classList.remove('stop-animation');
        clearTimeout(window.paletteTimeout);
        window.paletteTimeout = setTimeout(() => { if (currentScreen === 'START') statusText.innerText = "SNAKE"; }, 1000);
    }
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const menuTrack = [146.83, 0, 164.81, 0, 196.00, 0, 164.81, 0]; 
const gameTrack = [196.00, 220.00, 261.63, 0, 220.00, 261.63, 196.00, 0];
let bgmInterval = null;
let bgmIndex = 0;
let currentTrackList = menuTrack;

function playSynthNote(freq, duration, volume) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (freq === 0) return; 
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'square'; 
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function startMusic(trackType) {
    stopMusic();
    bgmIndex = 0;
    let intervalSpeed = (trackType === 'MENU') ? 500 : 250; 
    currentTrackList = (trackType === 'MENU') ? menuTrack : gameTrack;
    let volume = (trackType === 'MENU') ? 0.02 : 0.03; 

    bgmInterval = setInterval(() => {
        if (!soundEnabled || isPaused || currentScreen === 'GAMEOVER') return;
        let freq = currentTrackList[bgmIndex];
        playSynthNote(freq, (intervalSpeed / 1000) * 0.8, volume); 
        bgmIndex = (bgmIndex + 1) % currentTrackList.length;
    }, intervalSpeed);
}

function stopMusic() {
    if (bgmInterval) clearInterval(bgmInterval);
    bgmInterval = null;
}

let audioDesbloqueado = false;
function desbloquearAudio() {
    if (!audioDesbloqueado) {
        audioDesbloqueado = true;
        if (soundEnabled && currentScreen === 'START') startMusic('MENU');
    }
}
document.addEventListener("keydown", desbloquearAudio, { once: true });
document.addEventListener("mousedown", desbloquearAudio, { once: true });
document.addEventListener("touchstart", desbloquearAudio, { once: true });

function playSound(type) {
    if (!soundEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    if (type === 'start') {
        playSynthNote(523.25, 0.1, 0.05); setTimeout(() => playSynthNote(659.25, 0.1, 0.05), 100); setTimeout(() => playSynthNote(783.99, 0.2, 0.05), 200);
    } else {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        if (type === 'eat') {
            osc.type = 'square'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(); osc.stop(now + 0.1);
        } else if (type === 'bonus') {
            osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1600, now + 0.2);
            gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(); osc.stop(now + 0.2);
        } else if (type === 'die') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
            gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(); osc.stop(now + 0.4);
        }
    }
}

let attractSnake = [];
let attractDir = 'RIGHT';
let attractInterval;

function initAttractMode() {
    attractSnake = [];
    for(let i = 4; i >= 0; i--) { attractSnake.push({x: i * box, y: 0}); }
    attractDir = 'RIGHT';
    if(attractInterval) clearInterval(attractInterval);
    attractInterval = setInterval(attractLoop, 100); 
}

function updateAttractMode() {
    let head = {x: attractSnake[0].x, y: attractSnake[0].y};
    if (Math.random() < 0.05) {
        let dirs = ['LEFT', 'RIGHT', 'UP', 'DOWN'];
        if (attractDir === 'LEFT') dirs = dirs.filter(d => d !== 'RIGHT');
        if (attractDir === 'RIGHT') dirs = dirs.filter(d => d !== 'LEFT');
        if (attractDir === 'UP') dirs = dirs.filter(d => d !== 'DOWN');
        if (attractDir === 'DOWN') dirs = dirs.filter(d => d !== 'UP');
        attractDir = dirs[Math.floor(Math.random() * dirs.length)];
    }

    let nextX = head.x; let nextY = head.y;
    if (attractDir === 'LEFT') nextX -= box; else if (attractDir === 'RIGHT') nextX += box;
    else if (attractDir === 'UP') nextY -= box; else if (attractDir === 'DOWN') nextY += box;

    if (nextX < 0) nextX = canvas.width - box;
    else if (nextX >= canvas.width) nextX = 0;
    if (nextY < 0) nextY = canvas.height - box;
    else if (nextY >= canvas.height) nextY = 0;

    attractSnake.unshift({x: nextX, y: nextY});
    attractSnake.pop();
}

function renderAttractMode() {
    ctx.fillStyle = cScreen; ctx.fillRect(0, 0, canvas.width, canvas.height); 
    ctx.strokeStyle = `rgba(${cDarkRGB}, 0.05)`; ctx.lineWidth = 1;
    for(let i=0; i < canvas.width; i+=box) {
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); ctx.stroke();
    }
    
    attractSnake.forEach((part, index) => { 
        ctx.fillStyle = `rgba(${cDarkRGB}, 0.4)`;
        ctx.fillRect(part.x + 1, part.y + 1, box - 2, box - 2);
        if (index === 0) {
            ctx.fillStyle = cScreen;
            if (attractDir === "RIGHT") { ctx.fillRect(part.x + 13, part.y + 4, 3, 3); ctx.fillRect(part.x + 13, part.y + 13, 3, 3); }
            else if (attractDir === "LEFT") { ctx.fillRect(part.x + 4, part.y + 4, 3, 3); ctx.fillRect(part.x + 4, part.y + 13, 3, 3); }
            else if (attractDir === "UP") { ctx.fillRect(part.x + 4, part.y + 4, 3, 3); ctx.fillRect(part.x + 13, part.y + 4, 3, 3); }
            else if (attractDir === "DOWN") { ctx.fillRect(part.x + 4, part.y + 13, 3, 3); ctx.fillRect(part.x + 13, part.y + 13, 3, 3); }
        }
    });
}

function attractLoop() {
    if (currentScreen !== 'START') return;
    updateAttractMode();
    renderAttractMode();
}

function loadHighScore() {
    let mode = MODES[selectedModeIndex];
    let max = localStorage.getItem("snakeMax_" + mode) || 0;
    highScoreDisplay.innerText = max;
}

function changeMode(step) {
    selectedModeIndex += step;
    if (selectedModeIndex < 0) selectedModeIndex = MODES.length - 1;
    if (selectedModeIndex >= MODES.length) selectedModeIndex = 0;
    currentModeText.innerText = MODES[selectedModeIndex];
    loadHighScore();
}

function updateMenuSelection() {
    if (selectedMenuItem === 0) {
        btnStart.classList.add("selected"); btnStart.innerText = "> START <";
        btnTutorial.classList.remove("selected"); btnTutorial.innerText = "TUTORIAL";
    } else {
        btnStart.classList.remove("selected"); btnStart.innerText = "START";
        btnTutorial.classList.add("selected"); btnTutorial.innerText = "> TUTORIAL <";
    }
}

function toggleTutorial() {
    if (tutorialScreen.style.display === "none") {
        tutorialScreen.style.background = `rgba(${cScreenRGB}, 0.95)`;
        tutorialScreen.style.display = "flex";
    } else {
        tutorialScreen.style.display = "none";
    }
}

function showStartScreen() {
    currentScreen = 'START';
    selectedMenuItem = 0;
    statusText.innerText = "SNAKE";
    statusText.classList.remove('stop-animation'); 
    instructionText.style.display = "none";
    modeSelector.style.display = "flex";
    menuButtonsContainer.style.display = "flex"; 
    
    if(scoreboardPanel) scoreboardPanel.style.visibility = "hidden";
    overlay.style.background = "transparent";
    overlay.style.display = "flex";
    tutorialScreen.style.background = `rgba(${cScreenRGB}, 0.95)`;
    
    updateMenuSelection(); loadHighScore(); initAttractMode(); 
    if (audioDesbloqueado && soundEnabled) startMusic('MENU');
}

function initGame() {
    if(attractInterval) clearInterval(attractInterval); 
    snake = [ { x: 10 * box, y: 10 * box }, { x: 9 * box, y: 10 * box } ];
    direction = null; score = 0; levelIndex = 0; speed = 150;
    changingDirection = false; isPaused = false; currentScreen = 'PLAYING';
    bonusFood = null; clearTimeout(bonusTimer);
    
    overlay.style.background = `rgba(${cScreenRGB}, 0.95)`; 
    if(scoreboardPanel) scoreboardPanel.style.visibility = "visible";
    
    generateFood();
    scoreDisplay.innerText = score;
    levelTextDisplay.innerText = levelNames[levelIndex];
    overlay.style.display = "none"; tutorialScreen.style.display = "none";
    render(); 
}

function generateFood() {
    food = { x: Math.floor(Math.random() * (canvas.width / box)) * box, y: Math.floor(Math.random() * (canvas.height / box)) * box };
    if (snake.some(p => p.x === food.x && p.y === food.y)) return generateFood();
    if (bonusFood && food.x === bonusFood.x && food.y === bonusFood.y) return generateFood();
}

function generateBonus() {
    clearTimeout(bonusTimer);
    bonusFood = { x: Math.floor(Math.random() * (canvas.width / box)) * box, y: Math.floor(Math.random() * (canvas.height / box)) * box };
    if (bonusFood.x === food.x && bonusFood.y === food.y) return generateBonus();
    if (snake.some(p => p.x === bonusFood.x && p.y === bonusFood.y)) return generateBonus();
    bonusTimer = setTimeout(() => { bonusFood = null; }, 5000);
}

function togglePause() {
    if (currentScreen !== 'PLAYING' || !direction) return;
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameInterval);
        ctx.fillStyle = `rgba(${cDarkRGB}, 0.8)`; ctx.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
        ctx.fillStyle = cScreen; ctx.font = "20px 'Press Start 2P'"; ctx.textAlign = "center";
        ctx.fillText("PAUSADO", canvas.width / 2, canvas.height / 2 + 8);
    } else {
        gameInterval = setInterval(gameLoop, speed);
    }
}

function toggleMute() {
    desbloquearAudio(); soundEnabled = !soundEnabled; 
    if(soundIcon) soundIcon.style.opacity = soundEnabled ? "1" : "0.5"; 
    if (soundEnabled && !isPaused && currentScreen !== 'GAMEOVER') {
        if (currentScreen === 'START') startMusic('MENU');
        else if (currentScreen === 'PLAYING') startMusic('GAME');
    } else { stopMusic(); }
}

function handleAction() {
    desbloquearAudio();
    if (tutorialScreen.style.display === "flex") { toggleTutorial(); 
    } else if (currentScreen === 'START') {
        if (selectedMenuItem === 0) start();
        else if (selectedMenuItem === 1) toggleTutorial();
    } else if (currentScreen === 'GAMEOVER') { showStartScreen();
    } else if (currentScreen === 'PLAYING') { togglePause(); }
}

function handleInput(dir) {
    if (changingDirection || isPaused) return; 
    if (dir === "LEFT" && direction !== "RIGHT") { direction = "LEFT"; changingDirection = true; }
    else if (dir === "UP" && direction !== "DOWN") { direction = "UP"; changingDirection = true; }
    else if (dir === "RIGHT" && direction !== "LEFT") { direction = "RIGHT"; changingDirection = true; }
    else if (dir === "DOWN" && direction !== "UP") { direction = "DOWN"; changingDirection = true; }
}

function handleDpad(dir) {
    desbloquearAudio();
    if (currentScreen === 'START' && tutorialScreen.style.display === "none") {
        if (dir === 'LEFT') changeMode(-1);
        if (dir === 'RIGHT') changeMode(1);
        if (dir === 'UP') { selectedMenuItem = 0; updateMenuSelection(); }
        if (dir === 'DOWN') { selectedMenuItem = 1; updateMenuSelection(); }
        return;
    }
    if (currentScreen === 'PLAYING') handleInput(dir);
}

document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase(); 
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); handleAction(); return; }
    if (key === 'p') return togglePause();
    if (key === 'm') return toggleMute();
    if (key === 'c') return changePalette(); 
    
    if (currentScreen === 'START' && tutorialScreen.style.display === "none") {
        if (key === 'a' || key === 'arrowleft') changeMode(-1);
        if (key === 'd' || key === 'arrowright') changeMode(1);
        if (key === 'w' || key === 'arrowup') { selectedMenuItem = 0; updateMenuSelection(); }
        if (key === 's' || key === 'arrowdown') { selectedMenuItem = 1; updateMenuSelection(); }
    }
    if (currentScreen !== 'PLAYING') return;
    if (key === "a" || key === "arrowleft") handleInput("LEFT");
    else if (key === "w" || key === "arrowup") handleInput("UP");
    else if (key === "d" || key === "arrowright") handleInput("RIGHT");
    else if (key === "s" || key === "arrowdown") handleInput("DOWN");
});

function bindTouchButton(id, callback) {
    const btn = document.getElementById(id);
    if(btn) {
        btn.addEventListener("touchstart", (e) => { e.preventDefault(); callback(); }, {passive: false});
        btn.addEventListener("mousedown", (e) => { e.preventDefault(); callback(); });
    }
}

bindTouchButton("btnLeft", () => handleDpad("LEFT"));
bindTouchButton("btnUp", () => handleDpad("UP"));
bindTouchButton("btnRight", () => handleDpad("RIGHT"));
bindTouchButton("btnDown", () => handleDpad("DOWN"));
bindTouchButton("btnMute", toggleMute);
bindTouchButton("btnPause", handleAction);
bindTouchButton("btnSelectSys", changePalette); 
bindTouchButton("btnStartSys", () => { 
    desbloquearAudio(); 
    if(currentScreen === 'START') start(); 
    else if(currentScreen === 'GAMEOVER') showStartScreen();
});

if(soundIcon) soundIcon.addEventListener("click", toggleMute);
document.getElementById("btnPrevMode").addEventListener("click", () => { desbloquearAudio(); changeMode(-1); });
document.getElementById("btnNextMode").addEventListener("click", () => { desbloquearAudio(); changeMode(1); });
document.getElementById("startBtn").addEventListener("click", () => { if (currentScreen === 'START') start(); });
document.getElementById("btnTutorial").addEventListener("click", () => { if (currentScreen === 'START') toggleTutorial(); });
document.getElementById("btnCloseTutorial").addEventListener("click", toggleTutorial);

function render() {
    ctx.fillStyle = `rgba(${cScreenRGB}, 0.4)`; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = `rgba(${cDarkRGB}, 0.1)`; ctx.lineWidth = 1;
    for(let i=0; i < canvas.width; i+=box) {
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); ctx.stroke();
    }
    if (bonusFood) {
        ctx.fillStyle = (Date.now() % 400 < 200) ? cScreen : cDark; 
        ctx.fillRect(bonusFood.x + 2, bonusFood.y + 2, box - 4, box - 4);
    }
    ctx.fillStyle = cDark; ctx.fillRect(food.x + 4, food.y + 4, box - 8, box - 8);
    snake.forEach((part, index) => { 
        ctx.fillStyle = cDark; 
        ctx.fillRect(part.x + 1, part.y + 1, box - 2, box - 2); 
        
        if (index === 0) {
            ctx.fillStyle = cScreen;
            let dir = direction || "RIGHT";
            
            if (dir === "RIGHT") {
                ctx.fillRect(part.x + 13, part.y + 4, 3, 3);
                ctx.fillRect(part.x + 13, part.y + 13, 3, 3);
            } else if (dir === "LEFT") {
                ctx.fillRect(part.x + 4, part.y + 4, 3, 3);
                ctx.fillRect(part.x + 4, part.y + 13, 3, 3);
            } else if (dir === "UP") {
                ctx.fillRect(part.x + 4, part.y + 4, 3, 3);
                ctx.fillRect(part.x + 13, part.y + 4, 3, 3);
            } else if (dir === "DOWN") {
                ctx.fillRect(part.x + 4, part.y + 13, 3, 3);
                ctx.fillRect(part.x + 13, part.y + 13, 3, 3);
            }
        }
    });
}

function safeScorePulse() {
    scoreDisplay.classList.add('score-pulse'); setTimeout(() => { scoreDisplay.classList.remove('score-pulse'); }, 150);
}

function update() {
    changingDirection = false;
    ateFood = false;
    if (!direction) return;

    let snakeX = snake[0].x; let snakeY = snake[0].y;
    let mode = MODES[selectedModeIndex];

    if (direction === "LEFT") snakeX -= box; else if (direction === "UP") snakeY -= box;
    else if (direction === "RIGHT") snakeX += box; else if (direction === "DOWN") snakeY += box;

    if (mode === "PORTAL") {
        if (snakeX < 0) snakeX = canvas.width - box;
        else if (snakeX >= canvas.width) snakeX = 0;
        if (snakeY < 0) snakeY = canvas.height - box;
        else if (snakeY >= canvas.height) snakeY = 0;
    } else {
        if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height) return gameOver();
    }

    const newHead = { x: snakeX, y: snakeY };

    if (bonusFood && snakeX === bonusFood.x && snakeY === bonusFood.y) {
        score += 50; playSound('bonus'); safeScorePulse(); scoreDisplay.innerText = score;
        bonusFood = null; clearTimeout(bonusTimer);
        ateFood = true;
    }

    if (snakeX === food.x && snakeY === food.y) {
        score += 10; playSound('eat'); safeScorePulse(); scoreDisplay.innerText = score; generateFood();
        
        if (score % 50 === 0) {
            if (levelIndex < levelNames.length - 1) levelIndex++;
            levelTextDisplay.innerText = (levelIndex === levelNames.length - 1) ? "MAX" : levelNames[levelIndex];
            speed = Math.max(40, speed - 10);
            clearInterval(gameInterval); gameInterval = setInterval(gameLoop, speed);
        }
        
        if (mode === "BÓNUS" && score > 0 && (score % 50) === 0) generateBonus();
        ateFood = true;
    }

    if (!ateFood) {
        snake.pop();
    }

    if (snake.some(part => part.x === newHead.x && part.y === newHead.y)) return gameOver();
    snake.unshift(newHead);
}

function gameLoop() {
    update();
    if(currentScreen === 'PLAYING' && !isPaused) render();
}

function gameOver() {
    clearInterval(gameInterval);
    stopMusic(); playSound('die');
    currentScreen = 'GAMEOVER';
    statusText.innerText = "GAME OVER";
    statusText.classList.add('stop-animation'); 
    let mode = MODES[selectedModeIndex];
    let max = localStorage.getItem("snakeMax_" + mode) || 0;
    if (score > max) {
        localStorage.setItem("snakeMax_" + mode, score);
        highScoreDisplay.innerText = score;
    }
    
    instructionText.style.display = "block";
    instructionText.innerText = "Pressione START para voltar";
    modeSelector.style.display = "none";
    menuButtonsContainer.style.display = "none"; 
    
    overlay.style.background = `rgba(${cScreenRGB}, 0.95)`;
    setTimeout(() => { overlay.style.display = "flex"; }, 500);
    direction = null;
}

function start() {
    if(gameInterval) clearInterval(gameInterval);
    if(attractInterval) clearInterval(attractInterval); 
    stopMusic(); playSound('start'); 
    
    overlay.style.background = "transparent";
    menuButtonsContainer.style.display = "none";
    modeSelector.style.display = "none";

    setTimeout(() => {
        initGame();
        if (soundEnabled) startMusic('GAME');
        gameInterval = setInterval(gameLoop, speed);
    }, 500);
}

showStartScreen();
// Aplica classe 'monitor' só no desktop (rato + ecrã largo)
const desktopQuery = window.matchMedia('(min-width: 1025px) and (hover: hover)');
function applyLayout() {
    document.getElementById('gameConsole').classList.toggle('monitor', desktopQuery.matches);
}
applyLayout();
desktopQuery.addEventListener('change', applyLayout);