const fs = require('fs');

// Dummy DOM
global.window = {
    addEventListener: () => {},
    matchMedia: () => ({ matches: false })
};
global.document = {
    addEventListener: () => {},
    documentElement: { setAttribute: () => {} },
    getElementById: (id) => {
        return {
            innerHTML: '',
            appendChild: () => {},
            classList: { add: () => {}, remove: () => {} },
            addEventListener: () => {},
            querySelectorAll: () => [],
            textContent: ''
        };
    },
    createElement: () => ({
        className: '',
        appendChild: () => {}
    }),
    querySelectorAll: () => {
        return [{ addEventListener: () => {}, classList: { add: () => {}, remove: () => {} }, getAttribute: () => 'A' }];
    }
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};

// Load words
const wordsJs = fs.readFileSync('words.js', 'utf8');
const scriptJs = fs.readFileSync('script.js', 'utf8').replace("document.addEventListener('DOMContentLoaded', () => new LiarsWordle());", "");
const LiarsWordle = eval(`
    ${wordsJs}
    ${scriptJs}
    LiarsWordle;
`);

// Run tests
console.log("--- Starting Programmatic Tests ---");

const game = new LiarsWordle();
game.targetWord = "APPLE";
game.isInitialized = true;
game.gameStatus = 'playing';

// Override DOM methods for test
game.setupBoard = () => {};
game.setupEventListeners = () => {};
game.applySettings = () => {};
game.updateGrid = () => {};
game.shakeRow = () => {};
game.showToast = () => {};
game.animateTiles = () => {};
game.updateKeyboard = () => {};
game.showStatsModal = () => {};
game.endGame = () => {};

// Turn 1
game.currentGuess = "SPIKE";
game.submitGuess();
console.log("Turn 1 (SPIKE)");
console.log("True Colors: ", game.actualColors[0]);
console.log("Display Colors: ", game.displayColors[0]);
console.log("Active Lies: ", Object.keys(game.activeLies));

// Attempt duplicate guess
console.log("\nAttempting duplicate guess (SPIKE)");
let guessesCountBefore = game.guesses.length;
game.currentGuess = "SPIKE";
game.submitGuess();
if (game.guesses.length === guessesCountBefore) {
    console.log("PASS: Duplicate guess rejected.");
} else {
    console.log("FAIL: Duplicate guess accepted.");
}

// Turn 2
game.currentGuess = "SNAKE";
game.submitGuess();
console.log("\nTurn 2 (SNAKE)");
console.log("True Colors: ", game.actualColors[1]);
console.log("Display Colors: ", game.displayColors[1]);
console.log("Active Lies: ", Object.keys(game.activeLies));
console.log("Burned Letters: ", Array.from(game.burnedLetters));

// Check if previously absent letters were lied about
let lieOnAbsent = false;
for (let key in game.activeLies) {
    const lie = game.activeLies[key];
    if (lie.actualColor === 'absent' && game.displayColors[0][game.guesses[0].indexOf(key)] === 'absent') {
        lieOnAbsent = true;
    }
}
if (!lieOnAbsent) {
    console.log("PASS: No lie generated on previously absent letters.");
} else {
    console.log("FAIL: Lie generated on previously absent letters.");
}

console.log("--- Tests Completed ---");
