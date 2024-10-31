// DOM Elements
const skillPointsDisplay = document.getElementById("skill-points");
const strengthLevelDisplay = document.getElementById("strength-level");
const staminaLevelDisplay = document.getElementById("stamina-level");
const techniqueLevelDisplay = document.getElementById("technique-level");
const playerProgressBar = document.getElementById("player-progress");
const opponentProgressBar = document.getElementById("opponent-progress");
const gameFeedback = document.getElementById("game-feedback");
const skillAllocationDiv = document.querySelector(".skill-allocation");
const gameplayDiv = document.querySelector(".gameplay");
const winScreen = document.querySelector(".win-screen");
const loseScreen = document.querySelector(".lose-screen");
const countdownTimer = document.getElementById("countdown-timer");
const instructions = document.getElementById("instructions");

// Initial Values
let skillPoints = 10;
let player = { strength: 0, stamina: 0, technique: 0, progress: 0, isRecovering: false };
let opponent = { strength: 3, stamina: 3, technique: 3, progress: 0 };
let opponentMoves = ["flopWrist", "pronation", "hook", "rising", "kingsMove", "backPressure", "dragging", "press"];
let currentOpponentMove = "";
let moveCooldown = false;
let staminaRecoveryTimeout;
let gameTimer;
let timeRemaining = 120;

// Skill Allocation
function upgradeSkill(skill) {
    if (skillPoints > 0) {
        player[skill]++;
        skillPoints--;
        skillPointsDisplay.textContent = skillPoints;
        updateSkillDisplay(skill);
    }
}

function updateSkillDisplay(skill) {
    if (skill === "strength") strengthLevelDisplay.textContent = player.strength;
    else if (skill === "stamina") staminaLevelDisplay.textContent = player.stamina;
    else if (skill === "technique") techniqueLevelDisplay.textContent = player.technique;
}

// Start Game
function startGame() {
    skillAllocationDiv.classList.add("hidden");
    gameplayDiv.classList.remove("hidden");
    winScreen.classList.add("hidden");
    instructions.classList.add("hidden");
    loseScreen.classList.add("hidden");
    resetPlayerOpponentProgress();
    timeRemaining = 60;
    countdownTimer.textContent = timeRemaining;
    gameFeedback.textContent = "Game started! Select your techniques.";
    opponentMoveLoop();
    gameLoop();
    startCountdown();
}

// Start Countdown Timer
function startCountdown() {
  clearInterval(gameTimer);
  gameTimer = setInterval(() => {
    timeRemaining -= 0.1;
    countdownTimer.textContent = timeRemaining.toFixed(1);
    if (timeRemaining <= 0) {
      clearInterval(gameTimer);
      endGame("lose");
    }
  }, 100);
}

function useSkill(skill) {
  if (!moveCooldown && player.stamina > 0 && !player.isRecovering) {
      const skillEffect = calculateSkillEffect(skill);
      player.progress += skillEffect;
      player.stamina -= Math.floor(skillEffect / 2);
      evaluateCounter(skill);
      moveCooldown = true;
      setTimeout(() => (moveCooldown = false), 3000);
      updateProgressBars();
      checkWinCondition();
  } else if (player.isRecovering) {
      gameFeedback.textContent = "Recovering... Wait for stamina recharge.";
  } else {
      gameFeedback.textContent = "Move on cooldown. Wait to act again!";
  }
}

// Calculate Effect of Skill
function calculateSkillEffect(skill) {
    const baseEffect = player.technique + player.strength;
    switch (skill) {
        case "pronation": return baseEffect * 1.2;
        case "hook": return baseEffect * 1.3;
        case "rising": return baseEffect * 1.1;
        case "flopWrist": return baseEffect * 1.4;
        case "kingsMove": return baseEffect * 1.5;
        case "backPressure": return baseEffect * 1.3;
        case "dragging": return baseEffect * 1.2;
        case "press": return baseEffect * 1.3;
        default: return baseEffect;
    }
}

// Counter Mechanics for Moves
function evaluateCounter(playerMove) {
    const counterMoves = {
        flopWrist: "kingsMove",
        pronation: "hook",
        hook: "pronation",
        rising: "flopWrist",
        kingsMove: "rising",
        backPressure: "press",
        dragging: "backPressure",
        press: "dragging"
    };
    if (counterMoves[currentOpponentMove] === playerMove) {
        player.progress += 5;
        gameFeedback.textContent = `Successful counter! Used ${playerMove} against ${currentOpponentMove}.`;
    } else {
        gameFeedback.textContent = `Used ${playerMove}. Opponent used ${currentOpponentMove}.`;
    }
}

// Opponent Move Cycle
function opponentMoveLoop() {
    setInterval(() => {
        currentOpponentMove = opponentMoves[Math.floor(Math.random() * opponentMoves.length)];
        opponent.progress += opponent.strength + opponent.technique;
        gameFeedback.textContent = `Opponent used ${currentOpponentMove}! Counter quickly.`;
        updateProgressBars();
        checkWinCondition();
    }, 3000);
}

// Stamina Recovery
function startStaminaRecovery() {
  if (!player.isRecovering) {
    player.isRecovering = true;
    const recoveryTime = 5000 - Math.max(3000, 0.1 * player.stamina * 1000);
    gameFeedback.textContent = `Stamina depleted. Recovering for ${recoveryTime / 1000} seconds...`;
    staminaRecoveryTimeout = setTimeout(() => {
      player.stamina = 100;
      player.isRecovering = false;
      gameFeedback.textContent = "Recovered! Continue the match.";
      updateProgressBars();
    }, recoveryTime);
  }
}

// Core Game Loop
function gameLoop() {
    if (player.stamina <= 0) startStaminaRecovery();
    else if (!player.isRecovering) player.stamina = Math.min(100, player.stamina + player.stamina * 0.03);

    updateProgressBars();
    setTimeout(gameLoop, 1000);
}

// Update Progress Bars
function updateProgressBars() {
    playerProgressBar.style.width = `${player.progress}%`;
    opponentProgressBar.style.width = `${opponent.progress}%`;
}

// Check Win Condition
function checkWinCondition() {
    if (player.progress >= 100) {
        clearInterval(gameTimer);
        endGame("win");
    } else if (opponent.progress >= 100) {
        clearInterval(gameTimer);
        endGame("lose");
    }
}

// End Game
function endGame(result) {
    gameplayDiv.classList.add("hidden");
    if (result === "win") {
        winScreen.classList.remove("hidden");
        gameFeedback.textContent = "Congratulations! You have won the match!";
    } else {
        loseScreen.classList.remove("hidden");
        gameFeedback.textContent = "You lost the match. Better luck next time!";
    }
}

// Restart Game
function restartGame() {
    skillPoints = 4;
    opponent.strength += 2;
    opponent.stamina += 2;
    opponent.technique += 2;
    skillPointsDisplay.textContent = skillPoints;
    strengthLevelDisplay.textContent = player.strength;
    staminaLevelDisplay.textContent = player.stamina;
    techniqueLevelDisplay.textContent = player.technique;
    playerProgressBar.style.width = "0%";
    opponentProgressBar.style.width = "0%";
    winScreen.classList.add("hidden");
    loseScreen.classList.add("hidden");
    skillAllocationDiv.classList.remove("hidden");
}

// Reset player and opponent progress
function resetPlayerOpponentProgress() {
    player.progress = 0;
    opponent.progress = 0;
}
