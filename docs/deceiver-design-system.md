# The Deceiver: Wordle Design System

## Overview

This game should match the visual and interactive feel of the original Wordle (powerlanguage.co.uk/wordle) and high-quality clones like MikhaD's Wordle. The design is minimal, clean, and focused on clarity.

---

## 1. Visual Design

### 1.1 Typography

**Font Stack** (in order of preference):
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
```

**Font Weights**:
- Headers: Bold (700)
- Tile letters: Bold (700)
- Body text: Regular (400)

**Font Sizes**:
- Page title: 32–40px (desktop), 28px (mobile)
- Tile letters: 32–40px (desktop), 28px (mobile)
- Keyboard keys: 14–18px
- Modals: 20–24px (title), 16px (body)

---

### 1.2 Spacing & Layout

**Tile Grid**:
- Tile size: 62×62px (mobile) to 70×70px (desktop)
- Gap between tiles: 8px (mobile) to 10px (desktop)
- Border-radius: 4px
- Font weight: Bold (700)

**Game Board Container**:
- Max-width: 500px
- Padding: 16px (mobile) to 24px (desktop)
- Margin: auto (horizontally centered)

**Keyboard**:
- Key height: 40px (mobile) to 56px (desktop)
- Key min-width: 40px (mobile) to 43px (desktop)
- Gap between keys: 4px
- Border-radius: 4px
- Three rows:
  - Row 1: Q W E R T Y U I O P
  - Row 2: A S D F G H J K L (offset ~20px left)
  - Row 3: ENTER Z X C V B N M BACKSPACE

**Margins & Padding**:
- Page margin (top): 8px (mobile) to 16px (desktop)
- Game board margin (bottom): 16px (mobile) to 32px (desktop)
- Keyboard margin (top): 8px (mobile) to 16px (desktop)

---

## 2. Light Mode Color Scheme

### 2.1 Primary Colors

```css
:root {
  /* Backgrounds */
  --color-bg: #FFFFFF;
  --color-bg-modal: rgba(0, 0, 0, 0.5);
  
  /* Text */
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #565758;
  --color-text-light: #878A8C;
  
  /* Feedback Colors */
  --color-correct: #6AAA64;    /* Green */
  --color-present: #C9B458;    /* Yellow */
  --color-absent: #787C7E;     /* Gray */
  
  /* Tiles */
  --color-tile-empty-border: #D3D6DA;
  --color-tile-empty-bg: #FFFFFF;
  --color-tile-filled-border: #3A3A3C;
  
  /* Keyboard */
  --color-key-bg-default: #D3D6DA;
  --color-key-text: #1A1A1A;
  --color-key-border: transparent;
  
  /* Other */
  --color-divider: #D3D6DA;
  --color-shadow: rgba(0, 0, 0, 0.1);
}
```

---

## 3. Dark Mode Color Scheme

### 3.1 Dark Mode Override

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Backgrounds */
    --color-bg: #121213;
    --color-bg-modal: rgba(0, 0, 0, 0.75);
    
    /* Text */
    --color-text-primary: #FFFFFF;
    --color-text-secondary: #C1C2C1;
    --color-text-light: #9B9B9B;
    
    /* Feedback Colors */
    --color-correct: #6AAA64;    /* Green (unchanged) */
    --color-present: #C9B458;    /* Yellow (unchanged) */
    --color-absent: #565758;     /* Gray (darker in dark mode) */
    
    /* Tiles */
    --color-tile-empty-border: #3A3A3C;
    --color-tile-empty-bg: #121213;
    --color-tile-filled-border: #FFFFFF;
    
    /* Keyboard */
    --color-key-bg-default: #818384;
    --color-key-text: #FFFFFF;
    --color-key-border: transparent;
    
    /* Other */
    --color-divider: #3A3A3C;
    --color-shadow: rgba(0, 0, 0, 0.3);
  }
}
```

---

## 4. Component Styles

### 4.1 Tile Styles

**Empty Tile** (not yet filled):
```css
.tile {
  width: 62px;
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-tile-empty-border);
  border-radius: 4px;
  background-color: var(--color-tile-empty-bg);
  font-weight: 700;
  font-size: 32px;
  color: var(--color-text-primary);
  box-sizing: border-box;
}
```

**Filled Tile** (with letter, before submission):
```css
.tile.filled {
  border-color: var(--color-tile-filled-border);
}
```

**Submitted Tile with Feedback**:
```css
.tile.correct {
  background-color: var(--color-correct);
  border-color: var(--color-correct);
  color: #FFFFFF;
}

.tile.present {
  background-color: var(--color-present);
  border-color: var(--color-present);
  color: #FFFFFF;
}

.tile.absent {
  background-color: var(--color-absent);
  border-color: var(--color-absent);
  color: #FFFFFF;
}
```

---

### 4.2 Keyboard Key Styles

**Default Key** (unused):
```css
.key {
  min-width: 40px;
  height: 40px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background-color: var(--color-key-bg-default);
  color: var(--color-key-text);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.1s ease-in-out;
  user-select: none;
  -webkit-user-select: none;
}

.key:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.key:active {
  opacity: 0.7;
  transform: scale(0.95);
}
```

**Feedback Key States** (updated based on guess results):
```css
.key.correct {
  background-color: var(--color-correct);
  color: #FFFFFF;
}

.key.present {
  background-color: var(--color-present);
  color: #FFFFFF;
}

.key.absent {
  background-color: var(--color-absent);
  color: #FFFFFF;
}
```

**Special Keys** (ENTER, BACKSPACE):
```css
.key.big {
  min-width: 60px;
  font-size: 12px;
  font-weight: 700;
}
```

---

## 5. Animations

### 5.1 Standard Tile Flip (for new guesses)

```css
@keyframes tileFlip {
  0% {
    transform: rotateX(0deg);
    background-color: inherit;
    border-color: inherit;
  }
  
  50% {
    transform: rotateX(90deg);
  }
  
  100% {
    transform: rotateX(0deg);
  }
}

.tile.submitted {
  animation: tileFlip 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards;
  animation-delay: calc(var(--tile-index) * 0.1s);
}
```

**Timing**:
- Duration: 0.6s per tile
- Stagger: 0.1s delay between tiles (0s, 0.1s, 0.2s, 0.3s, 0.4s)
- Easing: `cubic-bezier(0.7, 0, 0.3, 1)` (smooth deceleration)
- Color changes at 50% of animation (0.3s)

---

### 5.2 RetroReveal Flip (when a lie is exposed)

```css
@keyframes retroReveal {
  0% {
    transform: rotateY(0deg) scale(1);
    filter: brightness(1);
  }
  
  25% {
    filter: brightness(1.2);
  }
  
  50% {
    transform: rotateY(180deg) scale(1.05);
    filter: brightness(1.5);
  }
  
  75% {
    filter: brightness(1.2);
  }
  
  100% {
    transform: rotateY(0deg) scale(1);
    filter: brightness(1);
  }
}

.tile.retro-reveal {
  animation: retroReveal 0.8s cubic-bezier(0.5, 0, 0.5, 1) forwards;
}
```

**Timing**:
- Duration: 0.8s
- Easing: `cubic-bezier(0.5, 0, 0.5, 1)` (symmetric ease)
- Shimmer effect: Brightness increases at 50% (midpoint)
- Color change: Happens at 50% of animation
- Visual cue: Clear contrast between old and new states

---

### 5.3 Shake Animation (for invalid words)

```css
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  
  25% {
    transform: translateX(-10px);
  }
  
  75% {
    transform: translateX(10px);
  }
}

.grid.shake {
  animation: shake 0.3s ease-in-out;
}
```

---

### 5.4 Pop Animation (for keyboard presses)

```css
@keyframes pop {
  0% {
    transform: scale(1);
  }
  
  50% {
    transform: scale(1.1);
  }
  
  100% {
    transform: scale(1);
  }
}

.key:active {
  animation: pop 0.1s ease-out;
}
```

---

## 6. Responsive Design

### 6.1 Mobile (< 600px)

```css
@media (max-width: 599px) {
  :root {
    --tile-size: 62px;
    --tile-gap: 8px;
    --font-size-tile: 32px;
    --font-size-title: 28px;
    --keyboard-key-min-width: 40px;
    --keyboard-key-height: 40px;
    --keyboard-key-gap: 4px;
  }
  
  .game-board {
    padding: 16px;
  }
  
  .keyboard-row {
    margin-bottom: 8px;
  }
}
```

### 6.2 Tablet/Desktop (≥ 600px)

```css
@media (min-width: 600px) {
  :root {
    --tile-size: 70px;
    --tile-gap: 10px;
    --font-size-tile: 40px;
    --font-size-title: 32px;
    --keyboard-key-min-width: 43px;
    --keyboard-key-height: 56px;
    --keyboard-key-gap: 4px;
  }
  
  .game-board {
    padding: 24px;
  }
  
  .keyboard-row {
    margin-bottom: 10px;
  }
}
```

---

## 7. Accessibility Features

### 7.1 High Contrast Mode

```css
@media (prefers-contrast: more) {
  :root {
    --color-correct: #228B22;    /* Stronger green */
    --color-present: #FFB000;    /* Stronger yellow */
    --color-absent: #2C2C2C;     /* Stronger gray */
  }
}
```

### 7.2 Color Blind Mode (Optional Enhancement)

```css
body.colorblind-mode {
  --color-correct: #FFB000;    /* Orange */
  --color-present: #4B7FFF;    /* Light Blue */
  --color-absent: #565758;     /* Gray (no change) */
}
```

### 7.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Modal/Dialog Styles

### 8.1 Win/Loss Modal

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-bg-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--color-bg);
  border-radius: 8px;
  padding: 32px;
  max-width: 400px;
  box-shadow: 0 4px 12px var(--color-shadow);
  text-align: center;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--color-text-primary);
}

.modal-body {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 24px;
  color: var(--color-text-secondary);
}

.modal-button {
  background-color: var(--color-correct);
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease-in-out;
}

.modal-button:hover {
  opacity: 0.9;
}

.modal-button:active {
  opacity: 0.8;
}
```

---

## 9. Browser Support

- Chrome/Edge: Latest 2 versions
- Safari: Latest 2 versions
- Firefox: Latest 2 versions
- Mobile browsers: iOS Safari 14+, Chrome for Android

**Key CSS Features Used**:
- CSS custom properties (variables)
- CSS Grid
- Flexbox
- CSS animations & transitions
- Media queries (prefers-color-scheme, prefers-motion, prefers-contrast)
- Transform 3D (rotateX, rotateY)

---

## 10. Implementation Checklist

- [ ] Define all CSS custom properties at `:root` level
- [ ] Implement light mode base styles
- [ ] Add dark mode overrides with `@media (prefers-color-scheme: dark)`
- [ ] Create tile flip animation with stagger effect
- [ ] Create retroreveal animation with shimmer
- [ ] Implement keyboard key feedback states
- [ ] Add responsive breakpoints for mobile/tablet/desktop
- [ ] Test all animations in Chrome, Safari, Firefox
- [ ] Verify dark mode contrast ratios (WCAG AA minimum)
- [ ] Test with reduced-motion preference enabled
- [ ] Test on actual mobile devices (iOS + Android)
- [ ] Add focus states for keyboard navigation
- [ ] Test with screen reader (VoiceOver, NVDA)

---

**End of Design System**
