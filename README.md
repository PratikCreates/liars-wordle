# Liar's Wordle 🧢

**Wordle, but the game is gaslighting you.**

Liar's Wordle is a twist on the classic game where the computer can lie. For the first four rounds, the game may "upgrade" a tile color (Gray to Yellow, or Yellow to Green). You have to find the truth before you run out of turns.

## How it works

### The Deception
The game can lie about a letter's status during the first 4 turns. It only ever lies by making a tile look better than it actually is.

### The Reveal
If you guess a letter that the game previously lied about, the lie is exposed. The tiles from previous rows will flip back to their real colors.

### No Cap Phase
From Turn 5 onwards, the game stops lying. Everything you see in the final two turns is the absolute truth.

## Statistics Dashboard

When the game ends, you get a full breakdown of your performance:

*   **Gaslight Index**: How much the game successfully tricked you.
*   **Detection Speed**: How fast you caught the lies.
*   **Deception Audit**: A turn-by-turn breakdown of every lie and whether you found it.

## Built with
*   HTML / CSS / JavaScript
*   No frameworks. Just pure code.

## How to play
1.  Clone the repo.
2.  Open `index.html` in your browser.
3.  Guess the word in 6 tries.
4.  Watch for the flip—if a tile changes color, you just caught a lie.