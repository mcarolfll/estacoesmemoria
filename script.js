// Configuração do Jogo
const GAME_CONFIG = {
    maxTime: 60, // segundos
    totalRounds: 3,
    pairsToFind: 8 // 4x4 grid = 16 cartas = 8 pares
};

// Sistema de Áudio (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const sounds = {
    flip: () => playTone(400, 'sine', 0.1),
    match: () => playMatchSound(),
    error: () => playErrorSound(),
    win: () => playWinSound()
};

function playTone(freq, type, duration, vol = 0.1) {
    if (!state.soundEnabled) return;
    
    // Resume context if suspended (browser policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playMatchSound() {
    if (!state.soundEnabled) return;
    playTone(600, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(800, 'sine', 0.2, 0.1), 100);
}

function playErrorSound() {
    if (!state.soundEnabled) return;
    playTone(150, 'sawtooth', 0.3, 0.05);
}

function playWinSound() {
    if (!state.soundEnabled) return;
    playTone(400, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(500, 'sine', 0.1, 0.1), 100);
    setTimeout(() => playTone(600, 'sine', 0.1, 0.1), 200);
    setTimeout(() => playTone(800, 'sine', 0.4, 0.1), 300);
}

// Ícones para as cartas (Pool total de imagens)
const ALL_AVAILABLE_ICONS = [
    'assets/img/img1.jpg', 'assets/img/img2.jpg', 'assets/img/img3.jpg', 'assets/img/img4.jpg', 
    'assets/img/img5.jpg', 'assets/img/img6.jpg', 'assets/img/img7.jpg', 'assets/img/img8.jpg', 'assets/img/img9.jpg'
];

// Estado do Jogo
let state = {
    currentRound: 1,
    players: [], // { id: 1, pairs: 0, timeLeft: 0 }
    isLocked: false,
    hasFlippedCard: false,
    firstCard: null,
    secondCard: null,
    timer: null,
    currentTime: GAME_CONFIG.maxTime,
    pairsFound: 0,
    soundEnabled: true
};


// Elementos DOM
const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    roundResult: document.getElementById('round-result-screen'),
    ranking: document.getElementById('ranking-screen')
};

const ui = {
    currentPlayer: document.getElementById('current-player-display'),
    timer: document.getElementById('timer-display'),
    pairs: document.getElementById('pairs-count'),
    board: document.getElementById('game-board'),
    roundPlayerNum: document.getElementById('round-player-num'),
    roundPairs: document.getElementById('round-pairs'),
    roundTime: document.getElementById('round-time'),
    rankingList: document.getElementById('ranking-list'),
    btnSound: document.getElementById('btn-sound')
};

// Botões e Eventos
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-next-round').addEventListener('click', nextRound);
// document.getElementById('btn-restart').addEventListener('click', restartGame); // Removido pois não existe no HTML
document.getElementById('btn-home').addEventListener('click', () => {
    switchScreen('start');
    // Opcional: Tocar som ao voltar
    sounds.flip();
});

ui.btnSound.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    ui.btnSound.textContent = state.soundEnabled ? '🔊' : '🔇';
    ui.btnSound.style.opacity = state.soundEnabled ? '1' : '0.5';
});

// Inicialização
function init() {
    // Inicializar estado de áudio se necessário
}

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function startGame() {
    // Resetar estado global
    state.players = [];
    state.currentRound = 1;
    
    // Iniciar Rodada 1
    prepareRound();
}

function prepareRound() {
    // Resetar estado da rodada
    state.currentTime = GAME_CONFIG.maxTime;
    state.pairsFound = 0;
    state.isLocked = false;
    state.hasFlippedCard = false;
    state.firstCard = null;
    state.secondCard = null;
    
    // Atualizar UI
    ui.currentPlayer.textContent = state.currentRound;
    ui.timer.textContent = `${state.currentTime}s`;
    ui.pairs.textContent = '0';
    ui.timer.style.color = 'var(--text-white)'; 
    
    // Gerar e embaralhar cartas
    setupBoard();
    
    // Mostrar tela de jogo
    switchScreen('game');
    
    // Iniciar timer
    startTimer();
}

function setupBoard() {
    ui.board.innerHTML = '';
    
    // Selecionar cartas para a rodada
    // Usar apenas as imagens disponíveis (trevo é apenas capa/verso)
    let availableIcons = [...ALL_AVAILABLE_ICONS];
    
    // Embaralhar as imagens disponíveis
    shuffleArray(availableIcons);
    
    // Pegar as 8 primeiras para formar os pares
    const roundIcons = availableIcons.slice(0, 8);
    
    // Duplicar ícones para criar pares (8 pares = 16 cartas)
    let cards = [...roundIcons, ...roundIcons];
    
    // Embaralhar (Fisher-Yates)
    shuffleArray(cards);

    // Definir cor da capa baseada na rodada
    const roundColors = [
        '#fff4aa', // Rodada 1: Amarelo (como definido no CSS)
        '#FFB6C1', // Rodada 2: Rosa Claro (Light Pink)
        '#87CEFA'  // Rodada 3: Azul Claro (Light Sky Blue)
    ];
    // Ajustar índice para 0-based
    const currentRoundIndex = (state.currentRound - 1) % roundColors.length;
    const cardCoverColor = roundColors[currentRoundIndex];
    
    // Criar elementos HTML
    cards.forEach(icon => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.icon = icon;
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front" style="background-color: ${cardCoverColor};">
                    <img src="assets/img/trevo.avif" alt="Logo">
                </div>
                <div class="card-back">
                    <img src="${icon}" alt="Imagem do Jogo">
                </div>
            </div>
        `;
        
        card.addEventListener('click', flipCard);
        ui.board.appendChild(card);
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startTimer() {
    clearInterval(state.timer);
    state.timer = setInterval(() => {
        state.currentTime--;
        ui.timer.textContent = `${state.currentTime}s`;
        
        // Alerta visual de tempo acabando
        if (state.currentTime <= 10) {
            ui.timer.style.color = 'var(--accent-pink)';
        }

        if (state.currentTime <= 0) {
            clearInterval(state.timer);
            endRound();
        }
    }, 1000);
}

function flipCard() {
    if (state.isLocked) return;
    if (this === state.firstCard) return; // Evitar duplo clique na mesma carta

    sounds.flip();
    this.classList.add('flipped');

    if (!state.hasFlippedCard) {
        // Primeiro clique
        state.hasFlippedCard = true;
        state.firstCard = this;
        return;
    }

    // Segundo clique
    state.secondCard = this;
    checkForMatch();
}

function checkForMatch() {
    let isMatch = state.firstCard.dataset.icon === state.secondCard.dataset.icon;

    isMatch ? disableCards() : unflipCards();
}

function disableCards() {
    sounds.match();
    // Manter viradas e desabilitar cliques
    state.firstCard.removeEventListener('click', flipCard);
    state.secondCard.removeEventListener('click', flipCard);
    
    // Feedback visual
    state.firstCard.classList.add('matched');
    state.secondCard.classList.add('matched');

    resetBoard();
    
    // Atualizar pontuação
    state.pairsFound++;
    ui.pairs.textContent = state.pairsFound;
    
    // Verificar vitória
    if (state.pairsFound === GAME_CONFIG.pairsToFind) {
        clearInterval(state.timer);
        setTimeout(() => {
            sounds.win();
            endRound();
        }, 800);
    }
}

function unflipCards() {
    state.isLocked = true;
    sounds.error();

    setTimeout(() => {
        state.firstCard.classList.remove('flipped');
        state.secondCard.classList.remove('flipped');
        resetBoard();
    }, 1000);
}

function resetBoard() {
    [state.hasFlippedCard, state.isLocked] = [false, false];
    [state.firstCard, state.secondCard] = [null, null];
}

function endRound() {
    clearInterval(state.timer);
    
    // Salvar dados do jogador
    state.players.push({
        id: state.currentRound,
        pairs: state.pairsFound,
        timeLeft: state.currentTime,
        timeUsed: GAME_CONFIG.maxTime - state.currentTime
    });

    // Atualizar tela de resultados da rodada
    ui.roundPlayerNum.textContent = state.currentRound;
    ui.roundPairs.textContent = state.pairsFound;
    ui.roundTime.textContent = `${state.currentTime}s`;

    switchScreen('roundResult');
}

function nextRound() {
    state.currentRound++;
    
    if (state.currentRound > GAME_CONFIG.totalRounds) {
        showRanking();
    } else {
        prepareRound();
    }
}

function showRanking() {
    sounds.win();
    // Ordenar jogadores
    // Critério 1: Mais pares
    // Critério 2: Menos tempo gasto (ou mais tempo sobrando)
    const sortedPlayers = [...state.players].sort((a, b) => {
        if (b.pairs !== a.pairs) {
            return b.pairs - a.pairs; // Descendente pares
        }
        return b.timeLeft - a.timeLeft; // Descendente tempo restante (quem tem mais tempo sobra ganha)
    });

    ui.rankingList.innerHTML = '';
    
    sortedPlayers.forEach((player, index) => {
        const item = document.createElement('div');
        item.classList.add('ranking-item');
        if (index === 0) item.classList.add('winner');
        
        item.innerHTML = `
            <span class="rank-pos">${index + 1}º</span>
            <span class="rank-name">Jogador ${player.id}</span>
            <div class="rank-score">
                <div>${player.pairs} Pares</div>
                <div style="font-size: 0.8em; color: #888;">${player.timeUsed}s gastos</div>
            </div>
        `;
        ui.rankingList.appendChild(item);
    });

    switchScreen('ranking');
}

function restartGame() {
    startGame();
}

// Iniciar app
init();
