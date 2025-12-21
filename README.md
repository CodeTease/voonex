# Voonex

**Voonex** is a modern, zero-dependency Terminal UI (TUI) library for Node.js, built with TypeScript. It provides a robust virtual buffer, reactive rendering system, and a rich set of widgets to build complex command-line interfaces with ease.

## Features

- **Zero Dependencies**: Lightweight and easy to audit.
- **Double Buffering & Diffing**: Efficient rendering that eliminates flickering and minimizes I/O.
- **Auto Layout**: Flexbox-like layout engine for responsive designs.
- **Layer Management**: Z-index support for Modals, Tooltips, and Popups.
- **Component System**: Built-in widgets like `Box`, `Menu`, `ProgressBar`, `Input`, `Table`, and more.
- **Reactive Rendering**: Automated screen updates via `Screen.mount()` and `Screen.scheduleRender()`.
- **Focus Management**: Built-in keyboard navigation and focus delegation.
- **Styling Engine**: Simple yet powerful API for ANSI colors and text modifiers.
- **TypeScript Support**: Written in TypeScript with full type definitions included.

## Installation

Install via npm:

```bash
npm install voonex
```

## Quick Start

Here is a minimal example showing how to initialize the screen and display a simple box.

```typescript
import { Screen, Box, Styler, Input } from 'voonex';

// 1. Enter the alternate screen buffer
Screen.enter();

// 2. Define your render function
function render() {
    // Render a Box at (5, 5) with a title
    Box.render([
        "Welcome to Voonex!",
        "Press 'q' to exit."
    ], {
        title: "Hello World",
        x: 5,
        y: 5,
        padding: 1,
        style: 'double',
        borderColor: 'cyan'
    });
}

// 3. Mount the render function to the screen loop
Screen.mount(render);

// 4. Handle Input
Input.onKey((key) => {
    if (key.name === 'q') {
        // Leave the screen buffer properly before exiting
        Screen.leave();
        process.exit(0);
    }
});
```

Run it with:
```bash
npx ts-node my-app.ts
```

## Core Concepts

### The Screen
The `Screen` class is the heart of Voonex. It manages the terminal buffer, handles resizing, and optimizes rendering using a diffing algorithm.

- `Screen.enter()`: Switches to the alternate buffer (like `vim` or `nano`).
- `Screen.leave()`: Restores the original terminal state. **Always call this before exiting.**
- `Screen.mount(renderFn, layer?)`: Registers a function to be called during the render cycle.
- `Screen.scheduleRender()`: Triggers a screen update.

#### Layer Management
Voonex uses a "Painter's Algorithm" with Z-index layers.
```typescript
import { Screen, Layer } from 'voonex';

Screen.mount(drawBackground, Layer.BACKGROUND); // 0
Screen.mount(drawContent, Layer.CONTENT);       // 10
Screen.mount(drawPopup, Layer.MODAL);           // 100
```

### Input Handling
Voonex provides global input listeners.

**Keyboard:**
```typescript
Input.onKey((key) => {
    console.log(key.name); 
});
```

### Layout Engine
The `Layout` class helps calculate coordinates dynamically (Flexbox-style).

```typescript
import { Layout, Screen } from 'voonex';

const { rects } = Layout.compute(Screen.size, {
    direction: 'row',
    children: [
        { weight: 1 }, // Left sidebar (33%)
        { weight: 2 }  // Main content (66%)
    ]
});

const sidebarRect = rects[0];
const contentRect = rects[1];
```

## Components

### Box
A container for text with optional borders, padding, and titles.

```typescript
Box.render([
    "Line 1",
    "Line 2"
], {
    x: 2, y: 2,
    width: 30,
    borderColor: 'green',
    style: 'round' // 'single', 'double', or 'round'
});
```

### Button
Interactive button that supports Enter.

```typescript
const btn = new Button({
    id: 'submit',
    text: "Submit",
    x: 10, y: 10,
    onPress: () => submitForm()
});
```

### Input Field
A fully featured text editor with cursor support, scrolling, and editing keys.

```typescript
const nameInput = new InputField({
    x: 2, y: 2,
    width: 20,
    placeholder: "Enter name..."
});

Input.onKey(key => {
    // Navigate focus
    if (key.name === 'tab') nameInput.focus();
    
    // Handle typing (Home, End, Arrows, Backspace supported)
    nameInput.handleKey(key);
});
```

### Popup
A modal dialog that overlays other content (uses `Layer.MODAL`).

```typescript
// Shows a message and waits for user to press Enter/Esc
await Popup.alert("This is an important message!", { title: "Alert" });
```

## License

This project is under the **MIT License**.
