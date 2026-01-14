# Voonex

**Voonex** is a modern, zero-dependency Terminal UI (TUI) library for Node.js, built with TypeScript. It provides a robust virtual buffer, reactive rendering system, and a rich set of widgets to build complex command-line interfaces with ease.

## Features

- **Zero Dependencies**: Lightweight and easy to audit.
- **Double Buffering & Diffing**: Efficient rendering that eliminates flickering and minimizes I/O.
- **Reactive Signals**: Modern state management inspired by SolidJS. State changes automatically trigger updates.
- **Component Lifecycle**: Class-based components with `mount`, `unmount`, and lifecycle hooks.
- **Auto Layout**: Flexbox-like layout engine for responsive designs.
- **Layer Management**: Z-index support for Modals, Tooltips, and Popups.
- **Component System**: Built-in widgets like `Box`, `Menu`, `ProgressBar`, `Input`, `Table`, and more.
- **Focus Management**: Built-in keyboard navigation and focus delegation.
- **Styling Engine**: Simple yet powerful API for ANSI colors and text modifiers.
- **TypeScript Support**: Written in TypeScript with full type definitions included.

## Installation

Install via npm:

```bash
npm install voonex
```

## Quick Start

Here is a minimal example showing how to create a reactive counter app.

```typescript
import { Screen, Component, createSignal, Input } from 'voonex';

// 1. Create a Component
class CounterApp extends Component {
    // Define reactive state
    private count = createSignal(0);

    // Getters/Setters for convenience
    get value() { return this.count[0](); }
    set value(v) { this.count[1](v); }

    constructor() {
        super();
        
        // Handle input to increment
        Input.onKey(key => {
            if (key.name === 'up') this.value = this.value + 1;
            if (key.name === 'down') this.value = this.value - 1;
            if (key.name === 'q') {
                Screen.leave();
                process.exit(0);
            }
        });
    }

    // 2. Implement render()
    // It runs automatically whenever 'this.value' changes!
    render() {
        Screen.write(5, 5, `Count: ${this.value}   `);
        Screen.write(5, 7, "Press Up/Down to change, Q to quit.");
    }
}

// 3. Setup Screen
Screen.enter();

// 4. Mount the App
const app = new CounterApp();
app.mount();
```

Run it with:
```bash
npx ts-node my-app.ts
```

## Core Concepts

### Reactive Signals
Voonex uses a fine-grained reactivity system. When you update a signal, Voonex automatically schedules a render for the next tick. No manual `render()` calls required.

```typescript
import { createSignal } from 'voonex';

const [count, setCount] = createSignal(0);

// Reading the value
console.log(count()); 

// Updating the value (triggers UI update)
setCount(5);
setCount(prev => prev + 1);
```

### Components & Lifecycle
Components extend the `Component` abstract class.

- `mount(zIndex?)`: Registers the component to the screen loop.
- `unmount()`: Removes the component.
- `render()`: The drawing logic.

**Lifecycle Hooks:**
- `init()`: Called on instantiation.
- `onMount()`: Called after mounting.
- `onUnmount()`: Called after unmounting.
- `destroy()`: Cleanup hook.

### The Screen
The `Screen` class is the heart of Voonex. It manages the terminal buffer, handles resizing, and optimizes rendering using a diffing algorithm.

- `Screen.enter()`: Switches to the alternate buffer (like `vim` or `nano`).
- `Screen.leave()`: Restores the original terminal state. **Always call this before exiting.**

#### Layer Management
Voonex uses a "Painter's Algorithm" with Z-index layers.
```typescript
import { Layer } from 'voonex';

// Components handle this automatically via mount()
myComponent.mount(Layer.MODAL);
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

## Built-in Components

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

### Button (Reactive)
Interactive button that supports focus and press states.

```typescript
const btn = new Button({
    id: 'submit',
    text: "Submit",
    x: 10, y: 10,
    onPress: () => submitForm()
});

btn.mount(); // Don't forget to mount!
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


> Voonex is currently in Beta stage.


## License

This project is under the **MIT License**.
