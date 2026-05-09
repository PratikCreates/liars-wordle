
const fs = require('fs');

// --- BROWSER MOCKS ---
global.window = {
    matchMedia: () => ({ matches: true })
};
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, val) { this.data[key] = val; }
};
global.navigator = {
    clipboard: { writeText: () => Promise.resolve() }
};
global.document = {
    getElementById: (id) => ({
        id: id,
        addEventListener: () => {},
        appendChild: () => {},
        innerHTML: '',
        innerText: '',
        classList: { 
            add: function(c) { this.classes = this.classes || []; this.classes.push(c); }, 
            remove: () => {}, 
            contains: (c) => (this.classes || []).includes(c)
        },
        querySelectorAll: () => [],
        querySelector: () => ({ addEventListener: () => {} }),
        setAttribute: () => {},
        style: {},
        value: '',
        checked: true
    }),
    querySelectorAll: () => [],
    createElement: () => ({
        classList: { add: () => {}, remove: () => {} },
        appendChild: () => {},
        addEventListener: () => {},
        setAttribute: () => {},
        style: {}
    }),
    documentElement: { setAttribute: () => {} },
    addEventListener: () => {}
};

global.TARGET_WORDS = ["CIGAR", "REBUT", "SISSY", "HUMPH", "AWAKE", "GRANT"];
global.VALID_GUESSES = ["CIGAR", "REBUT", "SISSY", "HUMPH", "AWAKE", "SPIKE", "SNAKE", "BATCH", "TRANS", "GRANT", "CRANE", "BRAND", "FRANK", "WRANG"];

// --- LOAD CLASS ---
const scriptContent = fs.readFileSync('script.js', 'utf8');
const classOnly = scriptContent.substring(0, scriptContent.lastIndexOf('document.addEventListener'));
eval(classOnly);

// --- TEST ENGINE ---
const results = { passed: 0, failed: 0 };
function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        results.passed++;
    } catch (e) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${e.message}`);
        results.failed++;
    }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || "Assertion failed"); }

console.log("🛠️  Running Comprehensive Logic Tests...\n");

// --- TESTS ---

test("Init: Class exists", () => {
    const game = new LiarsWordle();
    assert(game instanceof LiarsWordle);
});

test("Initialization: Target word chosen", () => {
    const game = new LiarsWordle();
    assert(TARGET_WORDS.includes(game.targetWord), "Target word must be from the list");
});

test("Dictionary: Invalid length guess rejected", () => {
    const game = new LiarsWordle();
    let toast = ""; game.showToast = (m) => toast = m;
    game.addLetter("A"); game.addLetter("B");
    game.submitGuess();
    assert(toast.includes("5 letters"), "Should reject short words");
});

test("Dictionary: Word not in list rejected", () => {
    const game = new LiarsWordle();
    let toast = ""; game.showToast = (m) => toast = m;
    game.addLetter("X"); game.addLetter("Y"); game.addLetter("Z"); game.addLetter("Q"); game.addLetter("W");
    game.submitGuess();
    assert(toast.includes("dictionary"), "Should reject words not in dictionary");
});

test("Guessing: Valid word accepted", () => {
    const game = new LiarsWordle();
    game.targetWord = "CIGAR";
    game.processGuess("SPIKE");
    assert(game.guesses.length === 1, "Valid guess should increment guesses array");
});

test("Color Logic: All Correct", () => {
    const game = new LiarsWordle();
    const colors = game.calculateColors("GRANT", "GRANT");
    assert(colors.every(c => c === 'correct'), "Matching word should be all green");
});

test("Deception Engine: No lies on last 2 turns", () => {
    const game = new LiarsWordle();
    game.targetWord = "CIGAR";
    const trueColors = ['absent', 'present', 'absent', 'absent', 'absent'];
    const res = game.applyDeception(trueColors, "SPIKE", 4);
    assert(JSON.stringify(res.displayColors) === JSON.stringify(trueColors), "Should not lie on turn 5");
});

test("Deception Engine: Lies only upgrade", () => {
    const game = new LiarsWordle();
    game.targetWord = "GRANT";
    for(let i=0; i<20; i++) {
        const trueColors = ['absent', 'present', 'absent', 'absent', 'absent'];
        const res = game.applyDeception(trueColors, "CRANE", 0);
        res.displayColors.forEach((c, idx) => {
            if (trueColors[idx] === 'absent') assert(c === 'absent' || c === 'present' || c === 'correct');
            if (trueColors[idx] === 'present') assert(c === 'present' || c === 'correct');
        });
    }
});

test("Deception Engine: Integrity Check", () => {
    const game = new LiarsWordle();
    game.targetWord = "GRANT";
    const trueColors = ['absent','absent','absent','absent','absent'];
    for(let i=0; i<100; i++) {
        const res = game.applyDeception(trueColors, "SPIKE", 0);
        assert(res.displayColors.every(c => c === 'absent'), "Must never lie about absent letters");
    }
});

test("Reveal Engine: Catching a lie", () => {
    const game = new LiarsWordle();
    game.targetWord = "GRANT";
    game.activeLies["R"] = { row: 0, colIndex: 1, actualColor: 'correct', lieColor: 'present' };
    game.guesses = ["CRANE"];
    const reveals = game.checkForReveals("WRANG"); 
    assert(reveals.length === 1, "Should catch the lie on R");
    assert(reveals[0].actualColor === 'correct', "Truth should be revealed");
});

test("Stats: Winning updates streaks", () => {
    localStorage.setItem('liars_wordle_stats', JSON.stringify({
        gamesPlayed: 10, gamesWon: 5, currentStreak: 2, maxStreak: 3, guessDistribution: [0,0,0,0,0,0]
    }));
    const game = new LiarsWordle();
    game.guesses = ["W1", "W2", "W3"]; 
    game.updatePersistentStats(true);
    assert(game.stats.gamesPlayed === 11);
    assert(game.stats.currentStreak === 3);
});

test("Persistence: repair old settings", () => {
    localStorage.setItem('liars_wordle_settings', JSON.stringify({ darkMode: false }));
    const game = new LiarsWordle();
    assert(game.settings.keyboardAssist === true);
});

test("Deception: Burned letters", () => {
    const game = new LiarsWordle();
    game.burnedLetters.add("A");
    const trueColors = ['present','absent','absent','absent','absent'];
    const res = game.applyDeception(trueColors, "APPLE", 0);
    assert(res.displayColors[0] === 'present', "Should not lie about burned letter");
});

console.log(`\n🏁 Tests Finished!`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);

if (results.failed > 0) process.exit(1);
else console.log("\n🌟 LOGIC IS BULLETPROOF.");
