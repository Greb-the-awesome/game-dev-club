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

let skillPoints = 10;
let player = { strength: 0, stamina: 0, technique: 0, progress: 0, isRecovering: false };
let opponent = { strength: 3, stamina: 3, technique: 3, progress: 0 };
let opponentMoves = ["flopWrist", "pronation", "hook", "rising", "kingsMove"];
let currentOpponentMove = "";
let staminaRecoveryTimeout;
let moveCooldown = false;

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
  player.progress = 0;
  opponent.progress = 0;
  moveCooldown = false;
  currentOpponentMove = "";
  gameFeedback.textContent = "Game started! Select your techniques.";
  opponentMoveLoop();
  gameLoop();
}

// Use Player Skill with 5-second cooldown
function useSkill(skill) {
  if (!moveCooldown && player.stamina > 0 && !player.isRecovering) {
    const skillEffect = calculateSkillEffect(skill);
    player.progress += skillEffect;
    player.stamina -= Math.floor(skillEffect / 2);
    evaluateCounter(skill);
    moveCooldown = true;
    setTimeout(() => (moveCooldown = false), 2500);
    updateProgressBars();
    checkWinCondition();
  } else if (player.isRecovering) {
    gameFeedback.textContent = "Recovering... Wait for stamina recharge.";
  } else {
    gameFeedback.textContent = "Move on cooldown. Wait to act again!";
  }
}

// Calculate Skill Effect
function calculateSkillEffect(skill) {
  const baseEffect = player.technique + player.strength;
  switch (skill) {
    case "pronation": return baseEffect * 1.2;
    case "hook": return baseEffect * 1.3;
    case "rising": return baseEffect * 1.1;
    case "flopWrist": return baseEffect * 1.4;
    case "kingsMove": return baseEffect * 1.5;
    default: return baseEffect;
  }
}

// Evaluate Counter Move for Bonus
function evaluateCounter(playerMove) {
  const counterMoves = {
    flopWrist: "kingsMove",
    pronation: "hook",
    hook: "pronation",
    rising: "flopWrist",
    kingsMove: "rising"
  };
  if (counterMoves[currentOpponentMove] === playerMove) {
    player.progress += 10; // Bonus progress for countering
    gameFeedback.textContent = `Successful counter! Used ${playerMove} against ${currentOpponentMove}.`;
  } else {
    gameFeedback.textContent = `Used ${playerMove}. Opponent used ${currentOpponentMove}.`;
  }
}

// Opponent Move Every 7 Seconds
function opponentMoveLoop() {
  setInterval(() => {
    currentOpponentMove = opponentMoves[Math.floor(Math.random() * opponentMoves.length)];
    opponent.progress += opponent.strength + opponent.technique;
    gameFeedback.textContent = `Opponent used ${currentOpponentMove}! Counter quickly.`;
    updateProgressBars();
    checkWinCondition();
  }, 7000); // Opponent moves every 7 seconds
}

// Stamina Recovery Timer
function startStaminaRecovery() {
  if (!player.isRecovering) {
    player.isRecovering = true;
    gameFeedback.textContent = "Stamina depleted. Recovering for 5 seconds...";
    staminaRecoveryTimeout = setTimeout(() => {
      player.stamina = 100;
      player.isRecovering = false;
      gameFeedback.textContent = "Recovered! Continue the match.";
      updateProgressBars();
    }, 5000); // Recover stamina after 10 seconds
  }
}

// Game Loop for Stamina Regeneration and Progress Tracking
function gameLoop() {
  if (player.stamina <= 0) startStaminaRecovery();
  else if (!player.isRecovering) player.stamina = Math.min(100, player.stamina + player.stamina * 0.03);

  updateProgressBars();
  setTimeout(gameLoop, 1000);
}

// Update Progress Bars
function updateProgressBars() {
  playerProgressBar.style.width = `${Math.min(100, player.progress)}%`;
  opponentProgressBar.style.width = `${Math.min(100, opponent.progress)}%`;
}

// Check Win Condition
function checkWinCondition() {
  if (player.progress >= 100) {
    gameFeedback.textContent = "Victory! Retrain and try a tougher opponent.";
    clearInterval(staminaRecoveryTimeout);
    resetGame();
  } else if (opponent.progress >= 100) {
    gameFeedback.textContent = "Defeated! Refine your strategies.";
    clearInterval(staminaRecoveryTimeout);
    resetGame();
  }
}

// Reset Game and Opponent Progression
function resetGame() {
  player.progress = 0;
  opponent.progress = 0;
  player.stamina = 100;
  opponent.strength += 1;  // Tougher opponent after each match
  opponent.technique += 1;
  skillPoints = 10;
  skillAllocationDiv.classList.remove("hidden");
  gameplayDiv.classList.add("hidden");
  gameFeedback.textContent = "";
  skillPointsDisplay.textContent = skillPoints;
  strengthLevelDisplay.textContent = 0;
  staminaLevelDisplay.textContent = 0;
  techniqueLevelDisplay.textContent = 0;
}

// Skill Allocation and Start Game
document.querySelector("#start-game").addEventListener("click", startGame);
Object.keys(player).forEach(skill => {
  if (document.querySelector(`#${skill}-level`)) {
    document.querySelector(`#${skill}-level`).textContent = player[skill];
  }
});
