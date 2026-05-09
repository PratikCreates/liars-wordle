# RD: The Deceiver (Twisted Wordle)

## 1. Project Overview

"The Deceiver" is a word-guessing game based on the Wordle format with a unique twist: a **Conditional Dishonesty Engine**. For the first four rounds, the game may intentionally lie to the player by "upgrading" a tile's feedback color. However, logical consistency is sacred—if a player re-tests a "lied-about" letter, the game reveals the truth and retroactively corrects previous errors.

---

## 2. Core Game Loop & Mechanics

### 2.1 Standard Rules

- **Target**: A 5-letter word selected from a standard dictionary
- **Attempts**: 6 guesses
- **Feedback Colors**:
  - **Green (G)**: Correct letter in correct position
  - **Yellow (Y)**: Correct letter in wrong position
  - **Gray/Blank (B)**: Letter not in the word

### 2.2 The Twist: The Deception Engine

**Honesty Schedule**:
- **Turns 1–4**: The game *may* lie (deception is optional, not mandatory)
- **Turns 5–6**: The game is 100% honest (no deception)

**The Lie Rules**:
- A Gray (B) tile can be upgraded to Yellow (Y)
- A Yellow (Y) tile can be upgraded to Green (G)
- A Green (G) tile can **NEVER** be lied about
- If a guess contains 4 or 5 True Greens, deception is bypassed; Truth is always returned

**The Lie Probability Logic**:
1. For each guess (Turns 1–4), identify the "Liar Pool": all tile indices where:
   - The actual color is Gray (B) or Yellow (Y), AND
   - The letter hasn't already been used for a lie (not in `burnedLetters`)
2. Generate a random selection from [Liar Pool indices] plus one -1 (representing "no lie")
3. If -1 is selected: Return the true colors (player is told the truth)
4. If a Liar Pool index is selected: Apply the lie for that position

**The "Upgrade" Rule**:
- Gray (B) → Yellow (Y)
- Yellow (Y) → Green (G)

### 2.3 The Reveal Mechanic (Retroactive Consistency)

**The "Burned" List**: 
- Any letter that has been the subject of a lie is added to a `burnedLetters` array
- A letter can only be lied about once across the entire game

**The Trigger**:
If a player includes a burned letter in a subsequent guess (in any position), the engine must:
1. **Reveal**: Retroactively change the color of the tile in the previous row where the lie occurred to its true color
2. **Verify**: Display the truth for that letter in the current row
3. **Animate**: The old tile should perform a "flip" or "shimmer" animation (see UI/UX section)

**Example**:
- Turn 1: Player guesses SLATE. The "E" is actually gray (not in word), but the engine lies and shows Yellow
- Turn 2: Player guesses DENIM (testing "E" again). The engine now must reveal the truth:
  - The "E" in row 1 flips from Yellow to Gray
  - The "E" in row 2 shows Gray

---

## 3. Functional Requirements

### 3.1 State Management

Maintain the following state throughout the game:

```javascript
{
  targetWord: string,           // The secret 5-letter word
  guesses: string[],            // Array of guessed words
  displayColors: string[][],    // Colors shown to the user (matrix of 'G'/'Y'/'B')
  actualColors: string[][],     // True Wordle colors (matrix of 'G'/'Y'/'B')
  activeLies: {                 // Map of letter -> {row, colIndex, actualColor, lieColor}
    [letter]: {
      row: number,
      colIndex: number,
      actualColor: string,
      lieColor: string
    }
  },
  burnedLetters: string[],      // Letters already used for a lie
  gameStatus: 'playing' | 'won' | 'lost'
}
```

### 3.2 Logic Flow (Per Guess)

1. **Calculate Truth**: Generate the standard Wordle color array for the guess against the target word
   
2. **Check for Victory**: If 5 Greens, the player wins immediately

3. **Check for Reveals** (only for Turns 2+):
   - Compare current guess letters against `activeLies`
   - If any lie matches:
     - Update `displayColors` for the historical row to match `actualColors`
     - Mark the tile for a "RetroReveal" animation
     - Remove the letter from `activeLies`
     - Keep the letter in `burnedLetters` (once burned, always burned)

4. **Deception Logic** (only for Turns 1–4 and if True Greens < 4):
   - Identify the "Liar Pool": indices where `actualColor` is B or Y AND the letter is not in `burnedLetters`
   - Roll RNG: randomly select from [Liar Pool indices, -1]
   - If a Liar Pool index is selected:
     - Apply "Upgrade" rule to the tile
     - Update `displayColors` for the current row
     - Add the letter to `burnedLetters`
     - Store the lie in `activeLies`

5. **Update Keyboard**: Update keyboard key colors based on `displayColors`
   - **Critical**: If a Reveal happened, the keyboard must immediately reflect the new truth
   - Priority: Use the most recent truthful information for each letter

6. **Prepare Display**: Return both `displayColors` (for UI) and metadata for animations

---

## 4. Technical Specifications

### 4.1 Framework & Libraries

- **Framework**: React (preferred for state management), Vue, or Vanilla JS
- **Styling**: CSS with CSS variables for theme support (light/dark mode)
- **Animations**: CSS transitions and keyframes for tile flips

### 4.2 Core Functions

```javascript
// Standard Wordle color calculation
function calculateWordleColors(guess: string, target: string): string[] {
  // Returns array of 5 colors: 'G', 'Y', or 'B'
}

// Deception engine
function applyDeception(
  trueColors: string[], 
  guess: string, 
  turn: number,
  burnedLetters: string[],
  activeLies: object
): { displayColors: string[], newLies: object, newBurned: string[] } {
  // Returns modified colors and updated state
}

// Check for retroactive reveals
function checkForReveals(
  currentGuess: string,
  activeLies: object
): { revisedLies: object, rowsToUpdate: number[] } {
  // Returns rows that need tile animations and updated activeLies
}
```

---

## 5. UI/UX Requirements: Wordle-Style Design

### 5.1 Color Palette (Light Mode)

| Element | Color | Usage |
|---------|-------|-------|
| Background | `#FFFFFF` | Main game background |
| Text (Primary) | `#1a1a1a` or `#000000` | Headers, labels |
| Correct (Green) | `#6AAA64` | Correct letter, correct position |
| Present (Yellow) | `#C9B458` | Correct letter, wrong position |
| Absent (Gray) | `#787C7E` | Letter not in word |
| Empty Tile Border | `#D3D6DA` | Unused/current row tiles |
| Keyboard Bg | `#FFFFFF` | Keyboard background |
| Keyboard Key Bg | `#D3D6DA` (default) | Unused keyboard keys |

### 5.2 Color Palette (Dark Mode)

| Element | Color | Usage |
|---------|-------|-------|
| Background | `#121213` | Main game background |
| Text (Primary) | `#FFFFFF` | Headers, labels |
| Correct (Green) | `#6AAA64` | Correct letter, correct position |
| Present (Yellow) | `#C9B458` | Correct letter, wrong position |
| Absent (Gray) | `#565758` | Letter not in word |
| Empty Tile Border | `#3A3A3C` | Unused/current row tiles |
| Keyboard Bg | `#121213` | Keyboard background |
| Keyboard Key Bg | `#818384` (default) | Unused keyboard keys |

### 5.3 Layout

**Game Grid**:
- 6 rows × 5 columns
- Each tile is typically 62×62px (mobile) to 70×70px (desktop)
- Gaps between tiles: 6–10px
- Border-radius: 4–6px for soft corners
- Font weight: Bold (700)
- Font size: 32–40px
- Use monospace or sans-serif font (e.g., Arial, Segoe UI, or system fonts)

**Game Board Container**:
- Max-width: 400px
- Centered horizontally
- Padding: 16px (mobile) to 24px (desktop)
- Background matches the mode (light/dark)

**Keyboard**:
- QWERTY layout in three rows
- Keys should be 40–45px tall
- Clickable/tappable with appropriate touch targets
- Color-coded based on feedback from all guesses (use `displayColors`)
- Updated in real-time as guesses are made
- Special keys: ENTER, BACKSPACE (or similar)

### 5.4 Animations

**Standard Tile Flip** (for new guesses):
- Flip animation on Y-axis
- Duration: 0.6s per tile (staggered: 0.1s delay between tiles)
- Easing: `cubic-bezier(0.7, 0, 0.3, 1)`
- At the midpoint (0.3s), the tile color changes

**RetroReveal Animation** (when a lie is exposed):
- Distinct 180-degree flip with a "shimmer" effect
- Duration: 0.8s
- Color transition happens at flip midpoint
- Visual cue: A subtle white or light glow during the flip
- CSS class: `retro-reveal` or `tile-corrected`

**Keyboard Key Feedback**:
- Subtle scale or highlight on click/tap
- Color transitions should be smooth (0.2s) when keys are updated based on new info

### 5.5 Accessibility

- **Dark Mode Support**: Use `prefers-color-scheme` media query to auto-detect OS theme preference, with option to override in settings
- **Color Blind Mode** (optional enhancement):
  - Gray → remains `#787C7E` (light) or `#565758` (dark)
  - Yellow → `#648FFF` or `#4B7FFF` (light blue)
  - Green → `#FFB000` (orange/gold)
- **High Contrast Mode**: Ensure sufficient contrast ratios (WCAG AA or AAA)
- **Keyboard Navigation**: Support arrow keys and Enter for submission
- **Screen Reader**: Descriptive aria-labels for tiles and buttons

---

## 6. Edge Case Handling

### 6.1 Double Letters

**Scenario**: Target word is `ABBEY`, player guesses `BABES`

**Challenge**: Ensure deception doesn't create a mathematically impossible scenario
- Example: Don't upgrade two `B`s to Yellow if only one `B` exists in the target

**Solution**:
```
Constraint: Do not upgrade B → Y if (count of Y + count of G for that letter) 
already matches the count in the target word
```

### 6.2 Repeated Words

If a player enters the exact same word twice:
- The second entry must trigger reveals of any lies from the first entry
- This is handled automatically by the "Check for Reveals" logic

### 6.3 The 4-Green Exception

If a guess contains 4 or 5 True Greens, the Deception Engine is bypassed entirely. Return absolute truth for that row.

### 6.4 The Win Condition

When the player guesses the correct word:
1. All active lies on the board must flip to their true colors
2. This should happen as part of the victory animation/celebration
3. The game ends after this animation completes

### 6.5 The Loss Condition

When the player runs out of guesses (6 attempts used):
1. Reveal the target word
2. Display a "Game Over" modal with:
   - The correct word
   - Any remaining unrevealed lies (show them flipping to truth)
   - A "Play Again" button

---

## 7. Build Agent Instructions

1. **Initialize**: Start with a standard Wordle clone structure
   
2. **Implement Core Functions**:
   - `calculateWordleColors(guess, target)` - Standard Wordle logic
   - `applyDeception(trueColors, guess, turn, burnedLetters, activeLies)` - Deception engine
   - `checkForReveals(currentGuess, activeLies)` - Retroactive reveal logic

3. **State Management**:
   - Create a `useGameState()` hook (React) or equivalent state manager
   - Maintain `displayColors` vs `actualColors` matrices separately
   - Track `activeLies` and `burnedLetters` throughout the game

4. **UI Components**:
   - **Tile**: Renders a single letter with color feedback
   - **Grid**: 6×5 grid of tiles
   - **Keyboard**: QWERTY keyboard with color-coded keys
   - **Modal**: Win/Loss/Instructions modals

5. **Animations**:
   - Standard flip: CSS `@keyframes tileFlip`
   - RetroReveal: CSS `@keyframes retroReveal` with shimmer effect
   - Tile animation triggers on guess submission

6. **Keyboard Logic**:
   - Derived from `displayColors` matrix
   - Prioritize most recent truth
   - Update in real-time as games progress

7. **Styling**:
   - Use CSS custom properties (variables) for colors
   - Implement `prefers-color-scheme` for light/dark mode
   - Ensure responsive design (mobile-first approach)
   - Test on desktop, tablet, and mobile viewports

8. **Testing**:
   - Unit tests for `calculateWordleColors()` and `applyDeception()`
   - Integration tests for reveal logic
   - Manual testing of animations across browsers

---

## 8. Example Gameplay Walkthrough

### Setup
- Target word: `PLANT`
- Burned letters: [] (empty)

### Turn 1: Player guesses `SLATE`

**Truth Calculation**:
- S: Gray (not in `PLANT`)
- L: Yellow (in `PLANT`, wrong position)
- A: Green (correct position)
- T: Yellow (in `PLANT`, wrong position)
- E: Gray (not in `PLANT`)

True colors: `[B, Y, G, Y, B]`

**Deception**: Engine randomly selects to lie on the "E" (index 4)
- Lie: Upgrade E from Gray → Yellow
- Display colors: `[B, Y, G, Y, Y]` ← Player sees this
- `activeLies = { E: { row: 0, colIndex: 4, actualColor: 'B', lieColor: 'Y' } }`
- `burnedLetters = ['E']`

**Result on Screen**:
- Tiles flip to show: Gray, Yellow, Green, Yellow, **Yellow** (lie!)
- Keyboard updates: L, A, T now colored on keyboard

---

### Turn 2: Player guesses `PLANT` (testing again)

**Truth Calculation**:
- P: Green
- L: Yellow (correct letter, position 1 is wrong in `PLANT`, wait—no! L is actually at position 1 in target... let's recalculate)

Actually, let me use a better example:

### Turn 2 (Revised): Player guesses `GRANT`

**Truth Calculation**:
- G: Gray (not in `PLANT`)
- R: Gray (not in `PLANT`)
- A: Green (correct position)
- N: Gray (not in `PLANT`)
- T: Yellow (in `PLANT`, wrong position—it's at position 4, not 5)

True colors: `[B, B, G, B, Y]`

**Check for Reveals**:
- Current guess has no letters in `activeLies`, so no reveals

**Deception**: Engine randomly selects to lie on G (index 0)
- Lie: Upgrade G from Gray → Yellow
- Display colors: `[Y, B, G, B, Y]`
- `activeLies = { E: { row: 0, ... }, G: { row: 1, colIndex: 0, ... } }`
- `burnedLetters = ['E', 'G']`

---

### Turn 3: Player guesses `PLAIN` (testing the "L" and "A" again, but not yet testing E or G)

**Truth Calculation**:
- P: Gray
- L: Yellow (correct letter, wrong position—it's at position 1, not 1... actually L is at position 1 in target `PLANT`, so this would be Green)

Let me use a cleaner example with target `PLANT`:

Actually, let's just note:

### Turn 3: Player guesses `LEANT`

**Truth Calculation**:
- L: Green (position 1, correct!)
- E: Yellow (E is NOT in `PLANT` actually... let me reconsider target word)

OK, let's use target word `LEAPT`:
- L at position 1
- E at position 2
- A at position 3
- P at position 4
- T at position 5

And repeat Turn 1: Player guesses `SLATE`

**Truth Calculation**:
- S: Gray
- L: Yellow (L is in word at position 1, not position 2)
- A: Green (position 3 match)
- T: Yellow (T is in word at position 5, not 4)
- E: Yellow (E is in word at position 2, not 5)

True colors: `[B, Y, G, Y, Y]`

**Deception**: Engine randomly selects to lie on index 0 (S → Yellow)
- Display: `[Y, Y, G, Y, Y]`
- `activeLies = { S: { row: 0, colIndex: 0, actualColor: 'B', lieColor: 'Y' } }`
- `burnedLetters = ['S']`

---

### Turn 2: Player guesses `BEAST` (testing S again)

**Truth Calculation**:
- B: Gray
- E: Green (position 2 match)
- A: Green (position 3 match)
- S: Gray (S not in target)
- T: Yellow (T at position 5, not 4)

True colors: `[B, G, G, B, Y]`

**Check for Reveals**:
- Current guess contains 'S' (at index 3)
- 'S' is in `activeLies` (was lied about in row 0, position 0)
- **Trigger reveal**:
  - Update `displayColors[0][0]` from Y to B (Gray)
  - Mark row 0, position 0 for RetroReveal animation
  - Remove S from `activeLies`

**Result**:
- Row 0, Position 0 animates from Yellow → Gray
- Row 1 displays: Gray, Green, Green, Gray, Yellow
- Keyboard updates: S now shows as Gray

---

## 9. Final Notes

- **Player Psychology**: The deception creates suspicion and engagement. When a lie is revealed, it should feel like a satisfying "aha!" moment
- **Balance**: Limit deception to maintain fairness. The game should remain solvable; deception is a twist, not a trap
- **Clarity**: When animations play, ensure the player understands what's happening (clear visual feedback is critical)

---

**End of Specification**
