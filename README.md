# Liar's Wordle 🧢

**Wordle, but the game is gaslighting you.**

Liar's Wordle is a twist on the classic game where the computer can lie. For the first four rounds, the game may "upgrade" a tile color (Gray to Yellow, or Yellow to Green). You have to find the truth before you run out of turns.

## Mechanics

### The Deception
The game can lie about a letter's status during the first 4 turns. It only ever lies by making a tile look better than it actually is (e.g., turning a Gray tile into a Yellow one).

### The Reveal
If you guess a letter that the game previously lied about, the deception is exposed. The tiles from previous rows will retroactively flip back to their correct colors.

### No Cap Phase
From Turn 5 onwards, the game stops lying. Everything you see in the final two turns is the absolute truth.

## Statistics Dashboard
At the end of each game, you receive a performance breakdown:
- **Gaslight Index**: A measure of how much the game successfully tricked you.
- **Detection Speed**: How many turns it took you to uncover each lie.
- **Deception Audit**: A turn-by-turn log of every lie and whether you successfully exposed it.

## Technical Details
- Built with standard HTML, CSS, and Vanilla JavaScript.
- Zero external frameworks or dependencies.
- High-fidelity endgame dashboard optimized for single-screen performance.

## How to Play
1. Clone the repository.
2. Open `index.html` in your browser.
3. Guess the word in 6 tries.
4. Watch for the flip: if a tile changes color, you just caught a lie.

## Credits
Special thanks to [MikhaD/wordle](https://github.com/MikhaD/wordle) for the open-source Wordle implementation that inspired the foundation of this project.

"No Cap. Just Code." 🧢🚀