// Get references to DOM elements
const gameContainer = document.getElementById("gameContainer");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const introModal = document.getElementById("introModal");
const strikesDisplay = document.getElementById("strikes"); // Get the strikes display
const encouragementDiv = document.getElementById("encouragement");
const waterFactDiv = document.getElementById("waterFact");
const levelInfo = document.getElementById("levelInfo"); // Show current level

// Array of encouragement messages
const encouragements = [
  "Great job! Keep collecting clean water!",
  "You're making a difference!",
  "Every drop counts!",
  "Awesome! Avoid those obstacles!",
  "Keep going, water hero!"
];

// Array of real water facts
const waterFacts = [
  "771 million people in the world live without clean water.",
  "Access to clean water can improve health and education.",
  "Women and girls spend 200 million hours every day collecting water.",
  "Clean water helps communities grow and thrive.",
  "Every $40 can bring clean water to one person in need."
];

let score = 0;
let timer = 20; // Changed from 30 to 20 seconds
let interval;
let strikes = 0;
let gridSize = 25;
let currentLevel = 1;
const maxLevel = 5;
const rowSize = 5; // 5 items per row

// Track if water was caught in the current level
let caughtWaterThisLevel = false;
// Track the timer for whack-a-mole water in Level 1
let moleTimeout = null;

// Sound effects
const waterSound = new Audio("https://www.soundjay.com/nature/water-drop-1.mp3");
const buzzSound = new Audio("https://www.soundjay.com/button/beep-07.wav");
// Add a happy sound for leveling up
const levelUpSound = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_115b9bfae8.mp3");

// Close the intro modal and make it available globally
function closeIntro() {
  introModal.style.display = "none";
}
window.closeIntro = closeIntro;

// Track the current active box index in the column
let activeBoxIndex = 0;

// Player lives and water collection goals
let lives = 3; // Player starts each level with 3 lives
let waterToCollect = 0; // How many water drops needed to win the level
let waterCollected = 0; // How many water drops collected this level
let levelTimer = null; // Timer for water/obstacle appearance
let levelTimeLeft = 0; // Time left in seconds for the level

// Add a display for lives
let livesDisplay = document.getElementById("livesDisplay");
if (!livesDisplay) {
  livesDisplay = document.createElement("div");
  livesDisplay.id = "livesDisplay";
  livesDisplay.style.fontWeight = "bold";
  livesDisplay.style.color = "#ff6666";
  livesDisplay.style.margin = "10px 0";
  document.getElementById("info").appendChild(livesDisplay);
}

// Helper: get level settings
function getLevelSettings(level) {
  // Returns: {waterCount, showTime, obstacleChance}
  if (level === 1) return { waterCount: 1, showTime: 3000, obstacleChance: 0.2 };
  if (level === 2) return { waterCount: 2, showTime: 2500, obstacleChance: 0.3 };
  if (level === 3) return { waterCount: 3, showTime: 2000, obstacleChance: 0.4 };
  if (level === 4) return { waterCount: 4, showTime: 1500, obstacleChance: 0.5 };
  // Level 5
  return { waterCount: 5, showTime: 1000, obstacleChance: 0.7 };
}

// Set up the game grid and start the level
function setupGame() {
  // Clear the board and encouragement
  gameContainer.innerHTML = "";
  encouragementDiv.textContent = "";
  showWaterFact();
  levelInfo.textContent = `Level ${currentLevel} - Villager ${currentLevel}`;
  // Reset lives and water counters for this level
  lives = 3;
  waterCollected = 0;
  const settings = getLevelSettings(currentLevel);
  waterToCollect = settings.waterCount * 3; // Require 3 rounds of water collection per drop
  updateLivesDisplay();
  updateScore(0);

  // Start the level timer (20 seconds per level)
  levelTimeLeft = 20;
  timerDisplay.textContent = levelTimeLeft;
  if (interval) clearInterval(interval);
  interval = setInterval(() => {
    levelTimeLeft--;
    timerDisplay.textContent = levelTimeLeft;
    if (levelTimeLeft <= 0) {
      clearInterval(interval);
      endGame(false); // Time's up, game over
    }
  }, 1000);

  // Start the water/obstacle appearance loop
  startLevelLoop();
}

// Show lives left
function updateLivesDisplay() {
  livesDisplay.textContent = `Lives: ${lives}`;
}

// Main loop for each level: show water and obstacles, then clear and repeat
function startLevelLoop() {
  // Clear any previous timer
  if (levelTimer) clearTimeout(levelTimer);

  // Get settings for this level
  const settings = getLevelSettings(currentLevel);
  const waterCount = settings.waterCount;
  const showTime = settings.showTime;
  const obstacleChance = settings.obstacleChance;

  // Prepare the column for this level
  const columnsWrapper = gameContainer.firstChild;
  let colDivs;
  let currentColDiv;
  let boxes;
  if (columnsWrapper) {
    colDivs = Array.from(columnsWrapper.children);
    currentColDiv = colDivs[currentLevel - 1];
    boxes = Array.from(currentColDiv.querySelectorAll(".game-item"));
  } else {
    // First time: create columns
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "center";
    wrapper.style.alignItems = "flex-end";
    wrapper.style.gap = "16px";
    for (let col = 1; col <= maxLevel; col++) {
      const colDiv = document.createElement("div");
      colDiv.style.display = "flex";
      colDiv.style.flexDirection = "column";
      colDiv.style.alignItems = "center";
      const label = document.createElement("div");
      label.textContent = `Villager ${col}`;
      label.style.fontWeight = "bold";
      label.style.color = col === currentLevel ? "#0099ff" : "#aaa";
      label.style.marginBottom = "6px";
      colDiv.appendChild(label);
      for (let i = 0; i < rowSize; i++) {
        const div = document.createElement("div");
        div.classList.add("game-item");
        div.textContent = "";
        if (col !== currentLevel) {
          div.style.backgroundColor = "#e6f7ff";
          div.style.opacity = "0.5";
          div.style.cursor = "not-allowed";
        }
        colDiv.appendChild(div);
      }
      wrapper.appendChild(colDiv);
    }
    gameContainer.appendChild(wrapper);
    colDivs = Array.from(wrapper.children);
    currentColDiv = colDivs[currentLevel - 1];
    boxes = Array.from(currentColDiv.querySelectorAll(".game-item"));
  }

  // Clear all boxes
  boxes.forEach(box => {
    box.textContent = "";
    box.style.backgroundColor = "";
    box.onclick = null;
    box.style.cursor = "pointer";
  });

  // Place water drops in random boxes
  let availableIndexes = [];
  for (let i = 0; i < rowSize; i++) availableIndexes.push(i);
  // Shuffle indexes
  for (let i = availableIndexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableIndexes[i], availableIndexes[j]] = [availableIndexes[j], availableIndexes[i]];
  }
  // Pick waterCount indexes for water
  const waterIndexes = availableIndexes.slice(0, waterCount);

  // Place water drops
  waterIndexes.forEach(idx => {
    boxes[idx].textContent = "💧";
    boxes[idx].onclick = function () {
      handleWaterClick(boxes[idx], boxes);
    };
  });

  // Place obstacles in other boxes
  for (let i = 0; i < rowSize; i++) {
    if (boxes[i].textContent === "" && Math.random() < obstacleChance) {
      const obstacle = Math.random() < 0.5 ? "🚧" : "🪣";
      boxes[i].textContent = obstacle;
      boxes[i].onclick = function () {
        handleObstacleClick(obstacle, boxes[i], boxes);
      };
    }
  }

  // After showTime ms, clear and repeat if level not finished
  levelTimer = setTimeout(() => {
    // Remove all water and obstacles
    boxes.forEach(box => {
      box.textContent = "";
      box.onclick = null;
    });
    // If player hasn't won or lost, repeat
    if (lives > 0 && waterCollected < waterToCollect && levelTimeLeft > 0) {
      startLevelLoop();
    }
  }, showTime);
}

// Whack-a-mole effect for water in Level 1
function startWhackAMoleWater() {
  // Get the current column's boxes
  const columnsWrapper = gameContainer.firstChild;
  const colDivs = Array.from(columnsWrapper.children);
  const currentColDiv = colDivs[currentLevel - 1];
  const boxes = Array.from(currentColDiv.querySelectorAll(".game-item"));

  // First, clear all boxes
  boxes.forEach(box => {
    box.textContent = "";
    box.style.backgroundColor = "";
    box.onclick = null;
    box.style.cursor = "pointer";
  });

  // Place obstacles randomly (and keep them visible until clicked)
  boxes.forEach((box, idx) => {
    // Don't place obstacle if this box will be used for water this round
    if (Math.random() < 0.25) {
      // Randomly choose obstacle type
      const obstacle = Math.random() < 0.5 ? "🚧" : "🪣";
      box.textContent = obstacle;
      box.onclick = function () {
        handleObstacleClick(obstacle, box, boxes);
      };
    }
  });

  // Pick a random box index for water (avoid boxes with obstacles)
  let availableIndexes = boxes
    .map((box, idx) => (box.textContent === "" ? idx : null))
    .filter(idx => idx !== null);

  if (availableIndexes.length === 0) {
    // If all boxes have obstacles, skip this round and try again soon
    moleTimeout = setTimeout(startWhackAMoleWater, 700);
    return;
  }

  const randomIdx = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
  const waterBox = boxes[randomIdx];
  waterBox.textContent = "💧";
  waterBox.onclick = function () {
    handleWaterClick(waterBox, boxes);
  };

  // Water disappears after a short time if not clicked, then appears elsewhere
  moleTimeout = setTimeout(() => {
    // Only remove water if not already clicked
    if (waterBox.textContent === "💧") {
      waterBox.textContent = "";
      waterBox.onclick = null;
      startWhackAMoleWater();
    }
  }, 900);
}

// Handle clicking a water drop
function handleWaterClick(box, boxes) {
  // Prevent clicking if the game is over
  if (startBtn.disabled === false) return;
  updateScore(10); // Add points
  box.textContent = "";
  waterSound.play(); // Play sound for feedback
  box.style.backgroundColor = "#b3e6ff"; // Visual feedback: blue flash
  setTimeout(() => {
    box.style.backgroundColor = "";
  }, 300);
  showEncouragement();
  waterCollected++;
  // Check if player has collected enough water for this level
  if (waterCollected >= waterToCollect) {
    // Level complete!
    clearTimeout(levelTimer);
    clearInterval(interval);
    levelUpSound.play();
    encouragementDiv.textContent = `Water delivered to Villager ${currentLevel}!`;
    setTimeout(() => {
      if (currentLevel < maxLevel) {
        currentLevel++;
        setupGame();
      } else {
        endGame(true); // Player wins the game!
      }
    }, 1500);
  }
}

// Handle clicking an obstacle
function handleObstacleClick(obstacle, box, boxes) {
  // Prevent clicking if the game is over
  if (startBtn.disabled === false) return;
  if (obstacle === "🚧") {
    updateScore(-5); // Subtract points
    box.textContent = "";
    buzzSound.play(); // Play buzz sound
    box.style.backgroundColor = "#ffcccc"; // Visual feedback: red flash
    setTimeout(() => {
      box.style.backgroundColor = "";
    }, 300);
    showEncouragement();
    lives--;
    updateLivesDisplay();
    if (lives <= 0) {
      clearTimeout(levelTimer);
      clearInterval(interval);
      endGame(false); // Game over
      return;
    }
  } else if (obstacle === "🪣") {
    updateScore(-8); // This line reduces the player's score by 8 points
    box.textContent = "";
    buzzSound.play();
    box.style.backgroundColor = "#ffe0b3";
    setTimeout(() => {
      box.style.backgroundColor = "";
    }, 300);
    encouragementDiv.textContent = "Oops! The bucket was empty. You lost points!";
  }
}

// Update the score display in real-time
function updateScore(amount) {
  score += amount;
  scoreDisplay.textContent = score; // This updates the score on the screen right away
}

// Update the strikes display in real-time
function updateStrikes() {
  strikesDisplay.textContent = strikes;
}

// Show a random encouragement message
function showEncouragement() {
  const message = encouragements[Math.floor(Math.random() * encouragements.length)];
  encouragementDiv.textContent = message;
}

// Show a random water fact
function showWaterFact() {
  const fact = waterFacts[Math.floor(Math.random() * waterFacts.length)];
  waterFactDiv.textContent = fact;
}

// Start the game timer and update the countdown every second
function startTimer() {
  timer = 20;
  timerDisplay.textContent = timer;
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => {
    timer--;
    timerDisplay.textContent = timer;
    if (timer <= 0) {
      clearInterval(interval);
      endGame("Time's up! Your final score is " + score);
    }
  }, 1000);
}

// Function to show a simple confetti effect when the player wins
function showConfetti() {
  // Create a container for confetti
  const confettiContainer = document.createElement('div');
  confettiContainer.style.position = 'fixed';
  confettiContainer.style.top = '0';
  confettiContainer.style.left = '0';
  confettiContainer.style.width = '100vw';
  confettiContainer.style.height = '100vh';
  confettiContainer.style.pointerEvents = 'none';
  confettiContainer.style.zIndex = '2000';

  // Add 40 confetti pieces using emoji
  for (let i = 0; i < 40; i++) {
    const confetti = document.createElement('div');
    const confettiEmojis = ['🎉', '✨', '💧', '🎊', '⭐'];
    confetti.textContent = confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];
    confetti.style.position = 'absolute';
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.top = `${-10 + Math.random() * 10}vh`;
    confetti.style.fontSize = `${1 + Math.random() * 1.5}rem`;
    confetti.style.opacity = '0.85';
    confetti.style.transition = 'top 1.5s linear, opacity 1.5s linear';
    confettiContainer.appendChild(confetti);

    // Animate confetti falling
    setTimeout(() => {
      confetti.style.top = `${70 + Math.random() * 25}vh`;
      confetti.style.opacity = '0';
    }, 50);
  }

  document.body.appendChild(confettiContainer);

  // Remove confetti after 1.7 seconds
  setTimeout(() => {
    confettiContainer.remove();
  }, 1700);
}

// Update the endGame function to show confetti when the player wins
function endGame(won) {
  // Stop timers
  clearInterval(interval);
  interval = null;
  clearTimeout(levelTimer);
  levelTimer = null;
  moleTimeout = null;

  // Show win or lose message
  if (won) {
    showConfetti(); // Show confetti effect
    encouragementDiv.textContent = "Congratulations! You helped all villagers!";
  } else {
    encouragementDiv.textContent = "Game Over! Try again to help the villagers!";
    // Show a random water fact
    showWaterFact();
  }

  // Enable the start button so the player can play again
  startBtn.disabled = false;
}

// Event listener for the start button
startBtn.addEventListener("click", () => {
  // Reset all game state for a new game
  score = 0;
  strikes = 0;
  timer = 20;
  currentLevel = 1;
  scoreDisplay.textContent = score;
  strikesDisplay.textContent = strikes;
  timerDisplay.textContent = timer;
  encouragementDiv.textContent = '';
  waterFactDiv.textContent = '';
  lives = 3;
  updateLivesDisplay();

  // Disable the start button to prevent re-entry
  startBtn.disabled = true;

  // Start the game setup
  setupGame();
});