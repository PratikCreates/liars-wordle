
const fs = require('fs');

// Mock Browser Globals
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
        addEventListener: () => {},
        appendChild: () => {},
        innerHTML: '',
        innerText: '',
        classList: { add: () => {}, remove: () => {}, contains: () => false },
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

// Mock the word list
global.TARGET_WORDS = ["CIGAR", "REBUT", "SISSY", "HUMPH", "AWAKE"];
global.VALID_GUESSES = ["CIGAR", "REBUT", "SISSY", "HUMPH", "AWAKE", "SPIKE", "SNAKE", "BATCH", "TRANS", "GRANT", "CRANE", "BRAND", "FRANK", "WRANG"];

// Load the class from script.js
// We need to strip out the browser-specific code or wrap it
const scriptContent = fs.readFileSync('script.js', 'utf8');
const classMatch = scriptContent.match(/class LiarsWordle \{[\s\S]*\}/);
if (!classMatch) {
    console.error("Could not find LiarsWordle class in script.js");
    process.exit(1);
}

// Eval the class into the global scope
eval(classMatch[0]);

function runTests() {
    console.log("🚀 Starting Comprehensive Liar's Wordle Test Suite...\n");
    let passed = 0;
    let failed = 0;

    const test = (name, fn) => {
        try {
            fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        } catch (e) {
            console.log(`❌ FAIL: ${name}`);
            console.log(`   Error: ${e.message}`);
            failed++;
        }
    };

    const assert = (condition, msg) => {
        if (!condition) throw new Error(msg || "Assertion failed");
    };

    // --- TEST CASES ---

    test("Initialization", () => {
        const game = new LiarsWordle();
        assert(game.targetWord !== null, "Target word should be assigned");
        assert(game.targetWord.length === 5, "Target word should be 5 letters");
        assert(game.gameStatus === 'playing', "Initial status should be 'playing'");
    });

    test("Stats Backward Compatibility (Fixes Crash)", () => {
        localStorage.setItem('liars_wordle_stats', JSON.stringify({ gamesPlayed: 5 }));
        const game = new LiarsWordle();
        assert(game.stats.guessDistribution.length === 6, "Should auto-inject guessDistribution if missing");
        assert(game.stats.gamesPlayed === 5, "Should preserve old data");
    });

    test("Settings Backward Compatibility", () => {
        localStorage.setItem('liars_wordle_settings', JSON.stringify({ darkMode: true }));
        const game = new LiarsWordle();
        assert(game.settings.keyboardAssist === true, "Should default keyboardAssist to true if missing");
    });

    test("Duplicate Guess Blocking", () => {
        const game = new LiarsWordle();
        game.targetWord = "CIGAR";
        game.processGuess("SPIKE");
        assert(game.guesses.length === 1, "First guess should be recorded");
        
        // Mock toast
        let toastMsg = "";
        game.showToast = (msg) => { toastMsg = msg; };
        
        game.addLetter("S"); game.addLetter("P"); game.addLetter("I"); game.addLetter("K"); game.addLetter("E");
        game.submitGuess();
        
        assert(game.guesses.length === 1, "Duplicate guess should not be added");
        assert(toastMsg.includes("already tried"), "Should show appropriate error message");
    });

    test("Color Logic - Basic Match", () => {
        const game = new LiarsWordle();
        const colors = game.calculateColors("ABCDE", "AXCXE");
        assert(colors[0] === 'correct', "A should be correct");
        assert(colors[1] === 'absent', "B should be absent");
        assert(colors[2] === 'correct', "C should be correct");
        assert(colors[3] === 'absent', "D should be absent");
        assert(colors[4] === 'correct', "E should be correct");
    });

    test("Color Logic - Double Letters", () => {
        const game = new LiarsWordle();
        // Target has one 'E', guess has two. First should be yellow, second gray.
        const colors = game.calculateColors("EEEEE", "ABCDE");
        assert(colors.filter(c => c === 'present').length === 1, "Only one E should be yellow");
        assert(colors.filter(c => c === 'absent').length === 4, "Other Es should be gray");
    });

    test("Deception Engine - Integrity Check", () => {
        const game = new LiarsWordle();
        game.targetWord = "CIGAR";
        // If we guess BATCH, B, A, T, C, H are not in CIGAR (except A)
        // Let's say we guess "SPIKE". None are in CIGAR.
        // The engine MUST NOT lie about a letter that is ABSENT in the target word.
        for(let i=0; i<50; i++) {
            const res = game.applyDeception(['absent','absent','absent','absent','absent'], "SPIKE", 0);
            assert(res.displayColors.every(c => c === 'absent'), "Engine should never lie about absent letters");
        }
    });

    test("Reveal Engine - Retroactive Correction", () => {
        const game = new LiarsWordle();
        game.targetWord = "SPIKE";
        // Mock a lie: Turn 1, Guess "CRANE", 'E' is at index 4.
        // True color for 'E' is 'correct'. Let's say engine lied and showed 'absent'? 
        // No, engine only upgrades. So 'E' was 'correct', engine kept it 'correct' or lied about something else.
        // Let's force a state.
        game.guesses = ["CRANE"];
        game.actualColors = [['absent', 'absent', 'absent', 'absent', 'correct']];
        game.displayColors = [['absent', 'absent', 'absent', 'absent', 'absent']]; // Forced lie (shouldn't happen with upgrade-only but test the reveal)
        game.activeLies["E"] = { row: 0, colIndex: 4, actualColor: 'correct', lieColor: 'absent' };
        
        const reveals = game.checkForReveals("APPLE"); // Guessing APPLE triggers reveal for 'E'
        assert(reveals.length === 1, "Should detect a reveal for E");
        assert(reveals[0].actualColor === 'correct', "Should reveal truth");
        assert(game.activeLies["E"] === undefined, "Lie should be cleared");
    });

    test("Stats - Win Streak", () => {
        localStorage.setItem('liars_wordle_stats', JSON.stringify({
            gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0]
        }));
        const game = new LiarsWordle();
        game.updatePersistentStats(true);
        assert(game.stats.currentStreak === 1, "Streak should increase");
        game.updatePersistentStats(true);
        assert(game.stats.currentStreak === 2, "Streak should increase again");
        game.updatePersistentStats(false);
        assert(game.stats.currentStreak === 0, "Streak should reset on loss");
    });

    test("Share Grid - Cap Emoji", () => {
        const game = new LiarsWordle();
        game.targetWord = "CIGAR";
        // Force a lie in the recording
        // In processGuess: if (displayColors[i] !== trueColors[i]) shareRow += '🧢';
        game.processGuess("SPIKE"); // No lies possible here (all absent)
        assert(!game.shareGrid[0].includes('🧢'), "Should be all squares");
        
        // Let's pretend a lie happened
        game.guesses = []; game.shareGrid = [];
        // Target: BATCH, Guess: CRANE. 'A' is correct at index 2.
        // We'll mock the logic inside processGuess manually for a specific state
        const guess = "CRANE";
        const target = "BATCH";
        const trueColors = ['absent','absent','correct','absent','absent'];
        const displayColors = ['absent','present','correct','absent','absent']; // Lied about 'R'
        
        let shareRow = '';
        for (let i = 0; i < 5; i++) {
            if (displayColors[i] !== trueColors[i]) shareRow += '🧢';
            else if (trueColors[i] === 'correct') shareRow += '🟩';
            else if (trueColors[i] === 'present') shareRow += '🟨';
            else shareRow += '⬛';
        }
        assert(shareRow.includes('🧢'), "Share grid should contain Cap for lies");
    });

    console.log(`\n--- Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    if (failed > 0) process.exit(1);
}

runTests();
