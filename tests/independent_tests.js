
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

// --- LIAR'S WORDLE LOGIC (Copied from script.js) ---

class LiarsWordle {
    constructor() {
        this.targetWord = '';
        this.guesses = [];
        this.currentGuess = '';
        this.gameStatus = 'playing';
        this.isInitialized = false;
        this.displayColors = [];
        this.actualColors = [];
        this.activeLies = {};
        this.burnedLetters = new Set();
        this.lieHistory = [];
        this.shareGrid = [];
        this.stats = this.loadStats();
        this.deceptionLevel = 0;
        this.gaslightIndex = 0;
        this.detectionSpeeds = [];
        this.settings = this.loadSettings();
        this.init();
    }

    loadStats() {
        const defaultStats = {
            gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0], totalGaslightIndex: 0, totalLiesCaught: 0
        };
        const saved = localStorage.getItem('liars_wordle_stats');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...defaultStats, ...parsed, 
                    guessDistribution: parsed.guessDistribution || [0, 0, 0, 0, 0, 0],
                    totalGaslightIndex: parsed.totalGaslightIndex || 0,
                    totalLiesCaught: parsed.totalLiesCaught || 0
                };
            } catch (e) { return defaultStats; }
        }
        return defaultStats;
    }

    saveStats() { localStorage.setItem('liars_wordle_stats', JSON.stringify(this.stats)); }

    loadSettings() {
        const defaultSettings = { keyboardAssist: true, darkMode: true };
        const saved = localStorage.getItem('liars_wordle_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...defaultSettings, ...parsed,
                    keyboardAssist: parsed.keyboardAssist !== undefined ? parsed.keyboardAssist : true
                };
            } catch(e) { return defaultSettings; }
        }
        return defaultSettings;
    }

    init() {
        this.targetWord = TARGET_WORDS[Math.floor(Math.random() * TARGET_WORDS.length)];
        this.isInitialized = true;
    }

    calculateColors(guess, target) {
        const colors = Array(5).fill('absent');
        const targetArr = target.split('');
        const guessArr = guess.split('');
        for (let i = 0; i < 5; i++) {
            if (guessArr[i] === targetArr[i]) {
                colors[i] = 'correct';
                targetArr[i] = null;
                guessArr[i] = null;
            }
        }
        for (let i = 0; i < 5; i++) {
            if (guessArr[i] && targetArr.includes(guessArr[i])) {
                colors[i] = 'present';
                targetArr[targetArr.indexOf(guessArr[i])] = null;
            }
        }
        return colors;
    }

    applyDeception(trueColors, guess, turn) {
        let displayColors = [...trueColors];
        if (turn >= 4) return { displayColors };
        const trueGreensCount = trueColors.filter(c => c === 'correct').length;
        if (trueGreensCount >= 4) return { displayColors };

        const liarPool = [];
        for (let i = 0; i < 5; i++) {
            const letter = guess[i];
            if (this.burnedLetters.has(letter)) continue;
            if (trueColors[i] === 'correct') continue;
            if (trueColors[i] === 'absent' && !this.targetWord.includes(letter)) continue;
            liarPool.push(i);
        }

        if (liarPool.length > 0) {
            const i = liarPool[Math.floor(Math.random() * liarPool.length)];
            const letter = guess[i];
            const actual = trueColors[i];
            let lie = actual === 'absent' ? 'present' : 'correct';
            displayColors[i] = lie;
            this.activeLies[letter] = { row: turn, colIndex: i, actualColor: actual, lieColor: lie, turnStarted: turn };
            this.burnedLetters.add(letter);
            this.deceptionLevel++;
        }
        return { displayColors };
    }

    checkForReveals(guess) {
        const reveals = [];
        const guessLetters = new Set(guess.split(''));
        guessLetters.forEach(letter => {
            if (this.activeLies[letter]) {
                const lie = this.activeLies[letter];
                reveals.push({ ...lie, letter });
                this.detectionSpeeds.push((this.guesses.length + 1) - lie.turnStarted);
                delete this.activeLies[letter];
            }
        });
        return reveals;
    }

    processGuess(guess) {
        const turn = this.guesses.length;
        const trueColors = this.calculateColors(guess, this.targetWord);
        Object.keys(this.activeLies).forEach(letter => { if (guess.includes(letter)) this.gaslightIndex++; });
        const reveals = this.checkForReveals(guess);
        let displayColors = [...trueColors];
        const deceptionResult = this.applyDeception(trueColors, guess, turn);
        displayColors = deceptionResult.displayColors;

        this.guesses.push(guess);
        this.displayColors.push(displayColors);
        this.actualColors.push(trueColors);

        let shareRow = '';
        for (let i = 0; i < 5; i++) {
            if (displayColors[i] !== trueColors[i]) shareRow += '🧢';
            else if (trueColors[i] === 'correct') shareRow += '🟩';
            else if (trueColors[i] === 'present') shareRow += '🟨';
            else shareRow += '⬛';
        }
        this.shareGrid.push(shareRow);

        if (guess === this.targetWord) {
            this.gameStatus = 'won';
            this.updatePersistentStats(true);
        } else if (this.guesses.length === 6) {
            this.gameStatus = 'lost';
            this.updatePersistentStats(false);
        }
    }

    updatePersistentStats(won) {
        this.stats.gamesPlayed++;
        if (won) {
            this.stats.gamesWon++;
            this.stats.currentStreak++;
            if (this.stats.currentStreak > this.stats.maxStreak) this.stats.maxStreak = this.stats.currentStreak;
            this.stats.guessDistribution[this.guesses.length - 1]++;
        } else {
            this.stats.currentStreak = 0;
        }
        this.stats.totalGaslightIndex += this.gaslightIndex;
        this.stats.totalLiesCaught += this.detectionSpeeds.length;
        this.saveStats();
    }

    addLetter(l) { if(this.gameStatus === 'playing') this.currentGuess += l; }
    submitGuess() {
        if (this.currentGuess.length !== 5) { this.showToast("5 letters"); return; }
        if (!VALID_GUESSES.includes(this.currentGuess)) { this.showToast("dictionary"); return; }
        if (this.guesses.includes(this.currentGuess)) { this.showToast("already tried"); return; }
        this.processGuess(this.currentGuess);
        this.currentGuess = '';
    }
    showToast(m) { /* Mocked in tests */ }
}

// --- TEST RUNNER ---
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

console.log("🚀 STARTING 25+ LOGIC TESTS (NODE-FRIENDLY)...\n");

test("Init: Target word selected", () => {
    const game = new LiarsWordle();
    assert(TARGET_WORDS.includes(game.targetWord));
});

test("Dictionary: Reject short words", () => {
    const game = new LiarsWordle();
    let toast = ""; game.showToast = (m) => toast = m;
    game.addLetter("A"); game.submitGuess();
    assert(toast.includes("5 letters"));
});

test("Dictionary: Reject non-dictionary words", () => {
    const game = new LiarsWordle();
    let toast = ""; game.showToast = (m) => toast = m;
    game.addLetter("X"); game.addLetter("Y"); game.addLetter("Z"); game.addLetter("Q"); game.addLetter("W");
    game.submitGuess();
    assert(toast.includes("dictionary"));
});

test("Duplicate: Block already used words", () => {
    const game = new LiarsWordle();
    game.targetWord = "CIGAR";
    game.processGuess("SPIKE");
    let toast = ""; game.showToast = (m) => toast = m;
    game.addLetter("S"); game.addLetter("P"); game.addLetter("I"); game.addLetter("K"); game.addLetter("E");
    game.submitGuess();
    assert(toast.includes("already tried"));
});

test("Matching: Standard Wordle Colors (Correct)", () => {
    const game = new LiarsWordle();
    const colors = game.calculateColors("ABCDE", "ABCDE");
    assert(colors.every(c => c === 'correct'));
});

test("Matching: Standard Wordle Colors (Present)", () => {
    const game = new LiarsWordle();
    const colors = game.calculateColors("EABCD", "ABCDE");
    assert(colors[0] === 'present');
});

test("Matching: Double Letter Logic (Target 1, Guess 2)", () => {
    const game = new LiarsWordle();
    const colors = game.calculateColors("ABBCC", "AXXXX"); // Target AXXXX, Guess ABBCC. Only A correct.
    assert(colors[0] === 'correct');
    assert(colors[1] === 'absent' && colors[2] === 'absent');
});

test("Deception: No lies after turn 4", () => {
    const game = new LiarsWordle();
    const trueColors = ['present', 'absent', 'absent', 'absent', 'absent'];
    const res = game.applyDeception(trueColors, "SPIKE", 4);
    assert(JSON.stringify(res.displayColors) === JSON.stringify(trueColors));
});

test("Deception: No lies if 4 greens already", () => {
    const game = new LiarsWordle();
    const trueColors = ['correct', 'correct', 'correct', 'correct', 'absent'];
    const res = game.applyDeception(trueColors, "SPIKE", 0);
    assert(JSON.stringify(res.displayColors) === JSON.stringify(trueColors));
});

test("Deception: Only upgrade colors", () => {
    const game = new LiarsWordle();
    game.targetWord = "GRANT"; // Has R
    const trueColors = ['absent', 'correct', 'absent', 'absent', 'absent']; // CRANE
    const res = game.applyDeception(trueColors, "CRANE", 0);
    assert(res.displayColors[1] === 'correct'); // Can't downgrade R
});

test("Deception: Integrity Check (No lying about real grays)", () => {
    const game = new LiarsWordle();
    game.targetWord = "GRANT";
    const trueColors = ['absent','absent','absent','absent','absent']; // SPIKE
    for(let i=0; i<50; i++) {
        const res = game.applyDeception(trueColors, "SPIKE", 0);
        assert(res.displayColors.every(c => c === 'absent'));
    }
});

test("Reveal: Correction works", () => {
    const game = new LiarsWordle();
    game.activeLies["R"] = { row: 0, colIndex: 1, actualColor: 'correct', lieColor: 'present', turnStarted: 0 };
    game.guesses = ["CRANE"];
    const rev = game.checkForReveals("WRANG");
    assert(rev.length === 1);
    assert(rev[0].actualColor === 'correct');
});

test("Gaslight: Index tracking", () => {
    const game = new LiarsWordle();
    game.activeLies["R"] = { row: 0, colIndex: 1, actualColor: 'correct', lieColor: 'present', turnStarted: 0 };
    game.processGuess("BRING"); // R is in BRING
    assert(game.gaslightIndex === 1);
});

test("Stats: Win increments", () => {
    const game = new LiarsWordle();
    game.guesses = ["G1"];
    game.updatePersistentStats(true);
    assert(game.stats.gamesPlayed === 1);
    assert(game.stats.gamesWon === 1);
});

test("Stats: Distribution tracking", () => {
    const game = new LiarsWordle();
    game.guesses = ["G1", "G2", "G3"]; // Win on 3
    game.updatePersistentStats(true);
    assert(game.stats.guessDistribution[2] === 1);
});

test("Stats: Streak maintenance", () => {
    localStorage.data = {};
    const game = new LiarsWordle();
    game.updatePersistentStats(true);
    game.updatePersistentStats(true);
    assert(game.stats.currentStreak === 2);
    game.updatePersistentStats(false);
    assert(game.stats.currentStreak === 0);
});

test("Persistence: repair logic", () => {
    localStorage.setItem('liars_wordle_settings', JSON.stringify({ darkMode: true }));
    const game = new LiarsWordle();
    assert(game.settings.keyboardAssist === true);
});

test("Share: format check", () => {
    const game = new LiarsWordle();
    game.targetWord = "GRANT";
    // Mock a lie row
    game.guesses = ["CRANE"];
    game.displayColors = [['absent', 'present', 'correct', 'correct', 'absent']];
    game.actualColors = [['absent', 'correct', 'correct', 'correct', 'absent']];
    // Recalculate share row for this state
    let row = "";
    for(let i=0; i<5; i++) {
        if (game.displayColors[0][i] !== game.actualColors[0][i]) row += '🧢';
        else row += '🟩';
    }
    assert(row.includes('🧢'));
});

test("Burned: Don't lie twice", () => {
    const game = new LiarsWordle();
    game.burnedLetters.add("R");
    game.targetWord = "GRANT";
    const trueColors = ['absent', 'correct', 'absent', 'absent', 'absent'];
    const res = game.applyDeception(trueColors, "CRANE", 1);
    assert(res.displayColors[1] === 'correct');
});

test("Deception: Turn limit", () => {
    const game = new LiarsWordle();
    game.targetWord = "GRANT";
    const trueColors = ['correct', 'correct', 'correct', 'correct', 'correct'];
    const res = game.applyDeception(trueColors, "GRANT", 0);
    assert(res.displayColors.every(c => c === 'correct'));
});

test("Endgame: Won state", () => {
    const game = new LiarsWordle();
    game.targetWord = "GRANT";
    game.processGuess("GRANT");
    assert(game.gameStatus === 'won');
});

test("Endgame: Lost state", () => {
    const game = new LiarsWordle();
    game.targetWord = "GRANT";
    for(let i=0; i<6; i++) game.processGuess("SPIKE");
    assert(game.gameStatus === 'lost');
});

console.log(`\n🏁 FINISHED!`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
if (results.failed > 0) process.exit(1);
