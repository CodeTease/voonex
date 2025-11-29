# Voonex

**Voonex** is a modern, zero-dependency Terminal UI (TUI) library for Node.js, built with TypeScript. It provides a robust virtual buffer, reactive rendering system, and a rich set of widgets to build complex command-line interfaces with ease.

## Features

- **Zero Dependencies**: Lightweight and easy to audit.
- **Double Buffering & Diffing**: Efficient rendering that eliminates flickering and minimizes I/O.
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
- `Screen.mount(renderFn)`: Registers a function to be called during the render cycle. Voonex uses a "Painter's Algorithm", so functions mounted later are drawn on top.
- `Screen.scheduleRender()`: Triggers a screen update. This is automatically called by most interactive components, but you can call it manually if you update state asynchronously (e.g., inside a `setInterval`).

### Input Handling
Voonex provides a global input listener wrapper around Node's `process.stdin`.

```typescript
import { Input } from 'voonex';

Input.onKey((key) => {
    console.log(key.name); // 'up', 'down', 'enter', 'a', 'b', etc.
    console.log(key.ctrl); // true if Ctrl is pressed
});
```

### Styling
The `Styler` class provides utilities for coloring and formatting text.

```typescript
import { Styler } from 'voonex';

const text = Styler.style("Success!", 'green', 'bold', 'underline');
```

## Components

Voonex comes with several built-in components. Components can be used in two ways:
1. **Static Rendering**: Using static methods like `Box.render()`.
2. **Stateful Instances**: Creating an instance (e.g., `new Menu()`) and calling its methods.

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

### Menu
A vertical list of selectable items.

```typescript
const menu = new Menu({
    title: "Main Menu",
    x: 4, y: 4,
    items: ["Start", "Options", "Exit"],
    onSelect: (index, item) => {
        console.log(`Selected: ${item}`);
    }
});

// In your input handler:
Input.onKey((key) => {
    menu.handleKey(key); // Passes key events to the menu
});

// In your render function:
menu.render();
```

### ProgressBar
Displays a progress bar.

```typescript
const bar = new ProgressBar({
    width: 20,
    total: 100,
    x: 4, y: 10,
    completeChar: '█',
    incompleteChar: '░'
});

// Update progress
bar.update(50); // 50%
```

### Popup
A modal dialog that overlays other content.

```typescript
// Shows a message and waits for user to press Enter/Esc
await Popup.alert("This is an important message!", { title: "Alert" });

// Asks for confirmation (returns boolean)
const confirmed = await Popup.confirm("Are you sure?", { title: "Confirm" });
```

### Input Field
A text input field for capturing user input.

```typescript
const nameInput = new InputField({
    x: 2, y: 2,
    width: 20,
    placeholder: "Enter name..."
});

Input.onKey(key => {
    if (key.name === 'tab') {
        nameInput.focus();
    }
    nameInput.handleKey(key);
});

// In render loop
nameInput.render();
```

## Advanced Usage

### Manual Layout
Voonex relies on absolute positioning `(x, y)`. For complex layouts, you can calculate coordinates dynamically based on `Screen.size`.

```typescript
const { width, height } = Screen.size;
const centerX = Math.floor(width / 2);
const centerY = Math.floor(height / 2);
```

### Creating Custom Components
Any class can be a component. To integrate with the Voonex ecosystem, it's recommended (but not required) to implement the `Focusable` interface if the component handles input.

```typescript
import { Screen, Styler, Focusable } from 'voonex';

class MyWidget implements Focusable {
    focus() { /* handle focus */ }
    blur() { /* handle blur */ }
    
    handleKey(key) {
        // return true if key was consumed
        return false;
    }

    render() {
        Screen.write(10, 10, "My Custom Widget");
    }
}
```

## License

This project is under the **MIT License**.
