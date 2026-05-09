// Words are now loaded from words.js (TARGET_WORDS and VALID_GUESSES)

class LiarsWordle {
    constructor() {
        this.targetWord = '';
        this.guesses = [];
        this.currentGuess = '';
        this.gameStatus = 'playing'; // 'playing', 'won', 'lost'
        this.isInitialized = false;
        
        this.displayColors = []; // Matrix of 'correct', 'present', 'absent'
        this.actualColors = [];  // Matrix of what colors SHOULD have been
        
        this.activeLies = {};    // letter -> {row, colIndex, actualColor, lieColor, turnStarted}
        this.burnedLetters = new Set(); // Letters already used for a lie
        this.lieHistory = [];    // Array to track detailed lie history
        this.shareGrid = [];     // Array to track exact share emoji output
        
        // Stats Persistence
        this.stats = this.loadStats();
        
        // Current Game Stats
        this.deceptionLevel = 0;
        this.gaslightIndex = 0;
        this.detectionSpeeds = [];

        // Settings
        this.settings = this.loadSettings();
        
        this.init();
    }

    loadStats() {
        const defaultStats = {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0],
            totalGaslightIndex: 0,
            totalLiesCaught: 0
        };
        const saved = localStorage.getItem('liars_wordle_stats');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Ensure all new fields exist to prevent backwards compatibility crashes
                return { ...defaultStats, ...parsed, 
                    guessDistribution: parsed.guessDistribution || [0, 0, 0, 0, 0, 0],
                    totalGaslightIndex: parsed.totalGaslightIndex || 0,
                    totalLiesCaught: parsed.totalLiesCaught || 0
                };
            } catch (e) {
                return defaultStats;
            }
        }
        return defaultStats;
    }

    saveStats() {
        localStorage.setItem('liars_wordle_stats', JSON.stringify(this.stats));
    }

    loadSettings() {
        const defaultSettings = {
            keyboardAssist: true,
            darkMode: true
        };
        const saved = localStorage.getItem('liars_wordle_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...defaultSettings, ...parsed,
                    keyboardAssist: parsed.keyboardAssist !== undefined ? parsed.keyboardAssist : true
                };
            } catch(e) {
                return defaultSettings;
            }
        }
        return defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('liars_wordle_settings', JSON.stringify(this.settings));
    }

    init() {
        this.targetWord = TARGET_WORDS[Math.floor(Math.random() * TARGET_WORDS.length)];
        console.log('Target Word:', this.targetWord);
        
        this.setupBoard();
        this.setupEventListeners();
        this.applySettings();
        
        // Show help modal on first visit
        if (!localStorage.getItem('liars_wordle_seen_help')) {
            document.getElementById('help-modal').classList.remove('hidden');
            localStorage.setItem('liars_wordle_seen_help', 'true');
        }

        // We are always initialized now, login moved to endgame
        this.isInitialized = true;
        document.getElementById('login-modal').classList.add('hidden');
        
        const username = localStorage.getItem('liars_wordle_user');
        if (username && this.stats.gamesPlayed > 0) {
            document.getElementById('stats-btn').classList.remove('hidden');
        }
    }

    setupBoard() {
        const board = document.getElementById('board');
        board.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.className = 'tile-row';
            row.id = `row-${i}`;
            for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.id = `tile-${i}-${j}`;
                row.appendChild(tile);
            }
            board.appendChild(row);
        }
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('click', () => this.handleInput(key.getAttribute('data-key')));
        });

        document.getElementById('login-btn').addEventListener('click', () => {
            const username = document.getElementById('username').value.trim();
            if (username) {
                localStorage.setItem('liars_wordle_user', username);
                document.getElementById('login-modal').classList.add('hidden');
                document.getElementById('save-progress-btn').classList.add('hidden');
                this.isInitialized = true;
                this.showToast(`Welcome, ${username}!`);
            }
        });

        document.getElementById('save-progress-btn').addEventListener('click', () => {
            const loginModal = document.getElementById('login-modal');
            loginModal.querySelector('h2').textContent = 'SAVE YOUR PROGRESS';
            loginModal.classList.remove('hidden');
        });

        document.getElementById('play-again-btn').addEventListener('click', () => location.reload());
        document.getElementById('stats-btn').addEventListener('click', () => this.showStatsModal());
        document.getElementById('help-btn').addEventListener('click', () => document.getElementById('help-modal').classList.remove('hidden'));
        document.getElementById('settings-btn').addEventListener('click', () => document.getElementById('settings-modal').classList.remove('hidden'));

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.modal-overlay').classList.add('hidden'));
        });

        // Settings
        document.getElementById('keyboard-assist').addEventListener('change', (e) => {
            this.settings.keyboardAssist = e.target.checked;
            this.saveSettings();
            this.updateKeyboard();
        });

        document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
            this.settings.darkMode = e.target.checked;
            this.saveSettings();
            this.applySettings();
        });

        document.getElementById('share-btn').addEventListener('click', () => {
            if (this.gameStatus === 'playing') return;
            const attemptCount = this.gameStatus === 'won' ? this.guesses.length : 'X';
            let text = `Liar's Wordle #${this.stats.gamesPlayed}\nScore: ${attemptCount}/6\n\n`;
            
            this.shareGrid.forEach(rowText => {
                text += rowText + '\n';
            });
            text += `\n[DECEPTION DETECTED]\nGaslight Index: ${this.gaslightIndex}\n`;
            
            let avgSpeed = 0;
            if (this.detectionSpeeds.length > 0) {
                avgSpeed = (this.detectionSpeeds.reduce((a, b) => a + b, 0) / this.detectionSpeeds.length).toFixed(1);
            }
            text += `Detection Speed: ${avgSpeed}\nNo Cap.`;
            
            navigator.clipboard.writeText(text).then(() => this.showToast('Copied to clipboard'));
        });
        
        // Settings Import/Export
        document.getElementById('export-data-btn').addEventListener('click', () => {
            const data = btoa(JSON.stringify(this.stats));
            navigator.clipboard.writeText(data).then(() => this.showToast('Data copied to clipboard!'));
        });

        document.getElementById('import-data-btn').addEventListener('click', () => {
            const data = prompt('Paste your exported data here:');
            if (data) {
                try {
                    this.stats = JSON.parse(atob(data));
                    this.saveStats();
                    this.showToast('Data imported successfully!');
                } catch (e) {
                    this.showToast('Invalid data format');
                }
            }
        });
    }

    applySettings() {
        document.documentElement.setAttribute('data-theme', this.settings.darkMode ? 'dark' : 'light');
        document.getElementById('dark-mode-toggle').checked = this.settings.darkMode;
        document.getElementById('keyboard-assist').checked = this.settings.keyboardAssist;
        this.updateKeyboard();
    }

    handleKeyDown(e) {
        if (!this.isInitialized || this.gameStatus !== 'playing') return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        
        const key = e.key.toUpperCase();
        if (key === 'ENTER') this.submitGuess();
        else if (key === 'BACKSPACE') this.deleteLetter();
        else if (/^[A-Z]$/.test(key)) this.addLetter(key);
    }

    handleInput(key) {
        if (!this.isInitialized || this.gameStatus !== 'playing') return;
        if (key === 'ENTER') this.submitGuess();
        else if (key === 'BACKSPACE') this.deleteLetter();
        else this.addLetter(key);
    }

    addLetter(letter) {
        if (this.currentGuess.length < 5) {
            this.currentGuess += letter;
            this.updateGrid();
        }
    }

    deleteLetter() {
        if (this.currentGuess.length > 0) {
            this.currentGuess = this.currentGuess.slice(0, -1);
            this.updateGrid();
        }
    }

    updateGrid() {
        const rowIdx = this.guesses.length;
        const tiles = document.getElementById(`row-${rowIdx}`).querySelectorAll('.tile');
        for (let i = 0; i < 5; i++) {
            const tile = tiles[i];
            if (i < this.currentGuess.length) {
                tile.textContent = this.currentGuess[i];
                tile.classList.add('filled');
            } else {
                tile.textContent = '';
                tile.classList.remove('filled');
            }
        }
    }

    submitGuess() {
        if (this.currentGuess.length !== 5) {
            this.showToast('Not enough letters');
            this.shakeRow(this.guesses.length);
            return;
        }

        const guess = this.currentGuess;
        
        if (this.guesses.includes(guess)) {
            this.showToast('Word already guessed');
            this.shakeRow(this.guesses.length);
            return;
        }

        // Optimization for GitHub Pages/Static: Ensure word list is checked locally
        if (!VALID_GUESSES.includes(guess)) {
            this.showToast('Not in word list');
            this.shakeRow(this.guesses.length);
            return;
        }

        this.processGuess(guess);
        this.currentGuess = '';
    }

    processGuess(guess) {
        const turn = this.guesses.length;
        // Turn 5 (index 4) and onwards are "No Cap"
        if (turn === 4) {
            const row = document.getElementById(`row-${turn}`);
            const badge = document.createElement('div');
            badge.className = 'no-cap-badge';
            badge.innerHTML = 'No Cap 🧢';
            row.style.position = 'relative';
            row.appendChild(badge);
            setTimeout(() => badge.classList.add('visible'), 1500);
            setTimeout(() => {
                badge.classList.remove('visible');
                setTimeout(() => badge.remove(), 600);
            }, 4500);
        }

        const trueColors = this.calculateColors(guess, this.targetWord);
        
        // Gaslight Index
        Object.keys(this.activeLies).forEach(letter => {
            if (guess.includes(letter)) this.gaslightIndex++;
        });

        // Reveals
        const reveals = this.checkForReveals(guess);
        
        // Deception Engine
        let displayColors = [...trueColors];
        const trueGreensCount = trueColors.filter(c => c === 'correct').length;
        
        if (turn < 4 && trueGreensCount < 4) {
            const deceptionResult = this.applyDeception(trueColors, guess, turn);
            displayColors = deceptionResult.displayColors;
        }

        this.guesses.push(guess);
        this.displayColors.push(displayColors);
        this.actualColors.push(trueColors);

        // Record Share Grid Row (Preserve deceptions for the final share)
        let shareRow = '';
        for (let i = 0; i < 5; i++) {
            if (displayColors[i] !== trueColors[i]) {
                shareRow += '🧢';
            } else if (trueColors[i] === 'correct') {
                shareRow += '🟩';
            } else if (trueColors[i] === 'present') {
                shareRow += '🟨';
            } else {
                shareRow += '⬛';
            }
        }
        this.shareGrid.push(shareRow);

        this.animateTiles(turn, displayColors, reveals);

        if (guess === this.targetWord) {
            this.gameStatus = 'won';
            this.updatePersistentStats(true);
            setTimeout(() => {
                const row = document.getElementById(`row-${turn}`);
                row.querySelectorAll('.tile').forEach((t, idx) => {
                    setTimeout(() => t.classList.add('bounce'), idx * 100);
                });
            }, 1500);
            setTimeout(() => this.endGame(true), 3000);
        } else if (this.guesses.length === 6) {
            this.gameStatus = 'lost';
            this.updatePersistentStats(false);
            setTimeout(() => {
                this.showToast(this.targetWord);
            }, 1500);
            setTimeout(() => this.endGame(false), 3000);
        }
    }

    calculateColors(guess, target) {
        const colors = Array(5).fill('absent');
        const targetArr = target.split('');
        const guessArr = guess.split('');

        // Pass 1: Mark Greens
        for (let i = 0; i < 5; i++) {
            if (guessArr[i] === targetArr[i]) {
                colors[i] = 'correct';
                targetArr[i] = null;
                guessArr[i] = null;
            }
        }

        // Pass 2: Mark Yellows
        for (let i = 0; i < 5; i++) {
            if (guessArr[i] === null) continue;
            
            const indexInTarget = targetArr.indexOf(guessArr[i]);
            if (indexInTarget !== -1) {
                colors[i] = 'present';
                targetArr[indexInTarget] = null;
            }
        }
        return colors;
    }

    checkForReveals(currentGuess) {
        const reveals = [];
        const lettersInGuess = new Set(currentGuess.split(''));
        lettersInGuess.forEach(letter => {
            if (this.activeLies[letter]) {
                const lie = this.activeLies[letter];
                reveals.push({ ...lie, letter });
                this.detectionSpeeds.push((this.guesses.length + 1) - lie.turnLied);
                
                // Update historical state (UI only, preserve shareGrid)
                this.displayColors[lie.row][lie.colIndex] = lie.actualColor;

                // Update lie history
                const lieRecord = this.lieHistory.find(l => l.letter === letter && l.turnRevealed === null);
                if (lieRecord) lieRecord.turnRevealed = this.guesses.length;
                
                delete this.activeLies[letter];
            }
        });
        return reveals;
    }

    applyDeception(trueColors, guess, turn) {
        const liarPool = [];
        for (let i = 0; i < 5; i++) {
            const letter = guess[i];
            let canLie = true;
            // Never lie about a letter that was already truthfully shown as absent
            for (let r = 0; r < turn; r++) {
                const prevGuess = this.guesses[r];
                for (let c = 0; c < 5; c++) {
                    if (prevGuess[c] === letter && this.displayColors[r][c] === 'absent') {
                        canLie = false;
                    }
                }
            }
            if ((trueColors[i] === 'absent' || trueColors[i] === 'present') && !this.burnedLetters.has(letter) && canLie) {
                liarPool.push(i);
            }
        }

        const displayColors = [...trueColors];
        if (liarPool.length > 0) {
            const options = [...liarPool, -1];
            const selection = options[Math.floor(Math.random() * options.length)];
            if (selection !== -1) {
                const i = selection;
                const letter = guess[i];
                const actual = trueColors[i];
                let lie = actual === 'absent' ? 'present' : 'correct';
                displayColors[i] = lie;
                this.activeLies[letter] = { row: turn, colIndex: i, actualColor: actual, lieColor: lie, turnLied: turn + 1 };
                this.burnedLetters.add(letter);
                this.deceptionLevel++;
                
                this.lieHistory.push({
                    letter: letter,
                    turnLied: turn + 1,
                    actualColor: actual,
                    lieColor: lie,
                    turnRevealed: null
                });
            }
        }
        return { displayColors };
    }

    animateTiles(rowIdx, colors, reveals) {
        const row = document.getElementById(`row-${rowIdx}`);
        const tiles = row.querySelectorAll('.tile');

        reveals.forEach(rev => {
            const prevTile = document.getElementById(`tile-${rev.row}-${rev.colIndex}`);
            setTimeout(() => {
                prevTile.classList.add('retro-reveal');
                setTimeout(() => {
                    prevTile.classList.remove('present', 'correct', 'absent');
                    prevTile.classList.add(rev.actualColor);
                }, 400);
                setTimeout(() => prevTile.classList.remove('retro-reveal'), 800);
            }, 0);
        });

        tiles.forEach((tile, i) => {
            setTimeout(() => {
                tile.classList.add('flip');
                setTimeout(() => tile.classList.add(colors[i]), 300);
                setTimeout(() => {
                    tile.classList.remove('flip');
                    if (i === 4) this.updateKeyboard();
                }, 600);
            }, i * 100);
        });
    }

    updateKeyboard() {
        const keys = document.querySelectorAll('.key');
        if (!this.settings.keyboardAssist) {
            keys.forEach(key => key.classList.remove('correct', 'present', 'absent'));
            return;
        }

        const keyboardResults = {};
        this.displayColors.forEach((rowColors, rowIdx) => {
            const guess = this.guesses[rowIdx];
            for (let i = 0; i < 5; i++) {
                const letter = guess[i];
                const status = rowColors[i];
                
                if (!keyboardResults[letter]) {
                    keyboardResults[letter] = status;
                } else {
                    const currentStatus = keyboardResults[letter];
                    if (status === 'correct') {
                        keyboardResults[letter] = 'correct';
                    } else if (status === 'present' && currentStatus !== 'correct') {
                        keyboardResults[letter] = 'present';
                    }
                    // If it's absent, we don't change currentStatus if it's already correct or present
                }
            }
        });

        keys.forEach(key => {
            const letter = key.getAttribute('data-key');
            if (keyboardResults[letter]) {
                key.classList.remove('correct', 'present', 'absent');
                key.classList.add(keyboardResults[letter]);
            }
        });
    }

    updatePersistentStats(won) {
        this.stats.gamesPlayed++;
        if (won) {
            this.stats.gamesWon++;
            this.stats.currentStreak++;
            if (this.stats.currentStreak > this.stats.maxStreak) {
                this.stats.maxStreak = this.stats.currentStreak;
            }
            this.stats.guessDistribution[this.guesses.length - 1]++;
        } else {
            this.stats.currentStreak = 0;
        }
        this.stats.totalGaslightIndex += this.gaslightIndex;
        this.stats.totalLiesCaught += this.detectionSpeeds.length;
        this.saveStats();
    }

    shakeRow(rowIdx) {
        const row = document.getElementById(`row-${rowIdx}`);
        row.classList.add('shake');
        setTimeout(() => row.classList.remove('shake'), 500);
    }

    showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 1500);
    }

    showStatsModal() {
        const modal = document.getElementById('stats-modal');
        let avgSpeed = 0;
        if (this.detectionSpeeds.length > 0) {
            const avg = this.detectionSpeeds.reduce((a, b) => a + b, 0) / this.detectionSpeeds.length;
            let rating = "Slow";
            if (avg <= 1.2) rating = "Elite";
            else if (avg <= 1.8) rating = "Fast";
            else if (avg <= 2.5) rating = "Good";
            
            avgSpeed = `${avg.toFixed(1)} <span style="font-size: 10px; opacity: 0.8;">(${rating})</span>`;
        }
        
        // Classic Stats
        const winPct = this.stats.gamesPlayed > 0 ? Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100) : 0;
        document.getElementById('stat-played').textContent = this.stats.gamesPlayed;
        document.getElementById('stat-win-pct').textContent = winPct;
        document.getElementById('stat-current-streak').textContent = this.stats.currentStreak;
        document.getElementById('stat-max-streak').textContent = this.stats.maxStreak;
        
        // Deception Stats
        const deceptionEl = document.getElementById('stat-deception-level');
        const speedEl = document.getElementById('stat-detection-speed');
        const gaslightEl = document.getElementById('stat-gaslight-index');
 
        deceptionEl.textContent = this.deceptionLevel;
        speedEl.innerHTML = avgSpeed + ' Turns';
        gaslightEl.textContent = this.gaslightIndex;

        // Render target word as tiles if lost
        if (this.gameStatus === 'lost') {
            const wordDisplay = document.getElementById('target-word-display');
            wordDisplay.innerHTML = '';
            [...this.targetWord].forEach(letter => {
                const tile = document.createElement('div');
                tile.className = 'tile correct';
                tile.style.width = '42px';
                tile.style.height = '42px';
                tile.style.fontSize = '1.4rem';
                tile.textContent = letter;
                wordDisplay.appendChild(tile);
            });
        }

        // Trigger animations
        [deceptionEl, speedEl, gaslightEl].forEach(el => {
            el.classList.remove('stat-animate', 'stat-glow');
            void el.offsetWidth; // Force reflow
            el.classList.add('stat-animate');
        });
        if (this.gaslightIndex > 0) gaslightEl.classList.add('stat-glow');
        
        // Render detailed stats if game is over
        if (this.gameStatus !== 'playing' && this.lieHistory.length > 0) {
            const container = document.getElementById('detailed-stats-container');
            const grid = document.getElementById('audit-grid');
            grid.innerHTML = '';
            
            this.lieHistory.forEach(lie => {
                const card = document.createElement('div');
                card.className = 'audit-card';
                
                const turn = document.createElement('div');
                turn.className = 'audit-turn';
                turn.textContent = `Turn ${lie.turnLied}`;
                
                const letter = document.createElement('div');
                letter.className = 'audit-letter';
                letter.textContent = lie.letter;
                
                const shift = document.createElement('div');
                shift.className = 'audit-shift';
                shift.innerHTML = `
                    <div class="color-dot ${lie.actualColor}"></div>
                    <span>&rarr;</span>
                    <div class="color-dot ${lie.lieColor}"></div>
                `;
                
                const status = document.createElement('div');
                status.className = 'audit-status';
                status.textContent = lie.turnRevealed ? '✅' : '🧢';
                status.title = lie.turnRevealed ? `Revealed on Turn ${lie.turnRevealed + 1}` : 'Never revealed';
                
                card.appendChild(turn);
                card.appendChild(letter);
                card.appendChild(shift);
                card.appendChild(status);
                grid.appendChild(card);
            });
            
            container.classList.remove('hidden');

            // Intelligence Brief Logic
            const briefContainer = document.getElementById('intelligence-brief');
            const summaryEl = document.getElementById('brief-summary');
            const adviceEl = document.getElementById('brief-advice');
            const accentColor = this.gameStatus === 'won' ? 'var(--color-correct)' : '#e91e63';
            
            briefContainer.style.borderLeftColor = accentColor;
            const briefDot = briefContainer.querySelector('span');
            if (briefDot) briefDot.style.backgroundColor = accentColor;
            
            const liesCaught = this.detectionSpeeds.length;
            const caughtPct = this.deceptionLevel > 0 ? Math.round((liesCaught / this.deceptionLevel) * 100) : 100;
            
            let summary = "";
            let advice = "";

            if (this.deceptionLevel === 0) {
                summary = "The deceiver played it completely straight.";
                advice = "A rare honest game. Keep your guard up for next time.";
            } else if (caughtPct === 100) {
                summary = `You exposed every single lie (${liesCaught}/${this.deceptionLevel}).`;
                advice = "Impeccable. You saw right through the deception.";
            } else if (caughtPct >= 50) {
                const s = liesCaught === 1 ? "" : "s";
                summary = `You caught ${liesCaught} out of ${this.deceptionLevel} lie${s}.`;
                advice = "Good intuition. You're narrowing down the truth.";
            } else {
                const hiddenCount = this.deceptionLevel - liesCaught;
                const s = hiddenCount === 1 ? "" : "s";
                summary = `The deceiver successfully hid ${hiddenCount} lie${s}.`;
                advice = "Trust your gut more. If a letter feels suspicious, test it again.";
            }

            if (this.gaslightIndex > 2) {
                advice = "High Gaslight Index! You're trusting the colors too much. Re-verify everything.";
            } else if (avgSpeed < 1.5 && liesCaught > 0) {
                advice = "Elite detection speed. You're identifying lies almost instantly.";
            }

            if (this.gameStatus === 'lost' && !advice) {
                advice = "The truth was hidden in plain sight. Watch for the shimmering tiles.";
            } else if (this.gameStatus === 'lost') {
                advice += " You were close, but the deceiver ran out the clock.";
            }

            summaryEl.textContent = summary;
            adviceEl.textContent = advice;
            briefContainer.classList.remove('hidden');
        } else {
            document.getElementById('detailed-stats-container').classList.add('hidden');
            document.getElementById('intelligence-brief').classList.add('hidden');
        }
        
        const username = localStorage.getItem('liars_wordle_user');
        const saveBtn = document.getElementById('save-progress-btn');
        if (!username) {
            saveBtn.classList.remove('hidden');
        } else {
            saveBtn.classList.add('hidden');
        }

        modal.classList.remove('hidden');
    }

    endGame(won) {
        Object.values(this.activeLies).forEach(lie => {
            const tile = document.getElementById(`tile-${lie.row}-${lie.colIndex}`);
            tile.classList.add('retro-reveal');
            setTimeout(() => {
                tile.classList.remove('present', 'correct', 'absent');
                tile.classList.add(lie.actualColor);
            }, 400);
        });

        if (won) {
            const turn = this.guesses.length;
            const messages = ["GENIUS", "MAGNIFICENT", "IMPRESSIVE", "SPLENDID", "CLOSE CALL", "HURRAY"];
            const msg = messages[turn - 1] || "HURRAY";
            
            this.showToast(msg);
            document.getElementById('win-message').classList.remove('hidden');
        } else {
            document.getElementById('target-word-display').textContent = this.targetWord;
            document.getElementById('loss-message').classList.remove('hidden');
            this.showToast("OOPS");
        }

        // Show stats button
        document.getElementById('stats-btn').classList.remove('hidden');

        // Show stats modal immediately
        setTimeout(() => this.showStatsModal(), 1500);
    }
}

document.addEventListener('DOMContentLoaded', () => new LiarsWordle());
