// ==========================================
// CORE: SCREEN MANAGER (The "Canvas")
// ==========================================

import { Cursor } from './Cursor';

interface Cell {
    char: string;
    style: string;
}

export class Screen {
    private static isAlternateBuffer = false;
    private static resizeTimeout: NodeJS.Timeout | null = null;
    
    // Double Buffering
    private static currentBuffer: Cell[][] = [];
    private static previousBuffer: Cell[][] = [];
    private static dirtyRows: boolean[] = [];
    
    // Layer Stack
    // Stores snapshots of the buffer before a new layer is added.
    private static layerStack: Cell[][][] = [];

    private static flushInterval: NodeJS.Timeout | null = null;
    private static width = 0;
    private static height = 0;

    /**
     * Enters the Alternate Screen Buffer (like Vim or Nano).
     */
    static enter() {
        if (this.isAlternateBuffer) return;
        process.stdout.write('\x1b[?1049h'); // Enter alternate buffer
        Cursor.hide();
        this.isAlternateBuffer = true;
        
        this.resizeBuffers();
        this.startLoop();
        this.onResize(() => this.resizeBuffers());
    }

    /**
     * Leaves the Alternate Screen Buffer and restores cursor.
     */
    static leave() {
        if (!this.isAlternateBuffer) return;
        this.stopLoop();
        Cursor.show();
        process.stdout.write('\x1b[?1049l'); // Leave alternate buffer
        this.isAlternateBuffer = false;
    }

    private static resizeBuffers() {
        this.width = process.stdout.columns || 80;
        this.height = process.stdout.rows || 24;

        // Initialize or Resize Buffers
        // Naive approach: Reset completely on resize to avoid artifacts
        this.currentBuffer = Array(this.height).fill(null).map(() => 
            Array(this.width).fill(null).map(() => ({ char: ' ', style: '' }))
        );
        this.previousBuffer = Array(this.height).fill(null).map(() => 
            Array(this.width).fill(null).map(() => ({ char: ' ', style: '' }))
        );
        // Mark all rows as dirty to ensure full initial render
        this.dirtyRows = Array(this.height).fill(true);
    }

    private static startLoop() {
        if (this.flushInterval) return;
        // 60 FPS approx
        this.flushInterval = setInterval(() => this.flush(), 16);
    }

    private static stopLoop() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
    }

    /**
     * Writes text at a specific coordinate into the virtual buffer.
     * Handles ANSI escape codes by parsing them and storing style state.
     */
    static write(x: number, y: number, text: string) {
        if (!this.isAlternateBuffer) {
            // Fallback for non-TUI mode or testing?
            // Usually we shouldn't be here if components call it.
            // But if called before enter(), maybe ignore or direct write?
            // Let's assume enter() was called.
            return;
        }

        if (y < 0 || y >= this.height) return;

        // Mark row as dirty
        this.dirtyRows[y] = true;

        let currentX = x;
        let currentStyle = "";

        // ANSI Parser Regex
        // Captures escape sequences
        const parts = text.split(/(\x1b\[[0-9;]*m)/);

        for (const part of parts) {
            if (part.startsWith('\x1b[')) {
                // It's a style code
                if (part === '\x1b[0m' || part === '\x1b[m') {
                    currentStyle = ""; // Reset
                } else {
                    currentStyle += part; // Accumulate style
                }
            } else {
                // Text content
                for (const char of part) {
                    if (currentX >= 0 && currentX < this.width) {
                        this.currentBuffer[y][currentX] = {
                            char: char,
                            style: currentStyle
                        };
                    }
                    currentX++;
                }
            }
        }
    }

    /**
     * Pushes the current screen state to a stack.
     * Call this before opening a popup or menu.
     */
    static pushLayer() {
        // Deep clone currentBuffer
        const snapshot = this.currentBuffer.map(row => row.map(cell => ({ ...cell })));
        this.layerStack.push(snapshot);
    }

    /**
     * Restores the screen state from the stack.
     * Call this when closing a popup or menu.
     */
    static popLayer() {
        const snapshot = this.layerStack.pop();
        if (snapshot) {
            // Restore buffer
            // We must ensure dimensions match (if resized, this might be tricky, but let's assume no resize for now)
            if (snapshot.length === this.height && snapshot[0].length === this.width) {
                 this.currentBuffer = snapshot;
                 // Force a flush of the entire screen
                 this.dirtyRows.fill(true);
            } else {
                // If dimensions changed, we can't easily restore. 
                // Fallback: clear and let components redraw?
                // For now, ignore invalid snapshots.
            }
        }
    }

    /**
     * Clears the virtual buffer.
     */
    static clear() {
        if (!this.currentBuffer.length) return;
        
        for (let y = 0; y < this.height; y++) {
            this.dirtyRows[y] = true;
            for (let x = 0; x < this.width; x++) {
                this.currentBuffer[y][x] = { char: ' ', style: '' };
            }
        }
    }

    /**
     * Diffs currentBuffer vs previousBuffer and writes changes to stdout.
     */
    static flush() {
        if (!this.currentBuffer.length) return;

        let output = "";
        let lastY = -1;
        let lastX = -1;
        let lastStyle = "";

        for (let y = 0; y < this.height; y++) {
            // Optimization: Skip rows that haven't changed
            if (!this.dirtyRows[y]) continue;
            this.dirtyRows[y] = false;

            for (let x = 0; x < this.width; x++) {
                const cell = this.currentBuffer[y][x];
                const prev = this.previousBuffer[y][x];

                // Check for change
                if (cell.char !== prev.char || cell.style !== prev.style) {
                    // Update Previous Buffer
                    this.previousBuffer[y][x] = { ...cell }; // Clone

                    // Move Cursor if needed
                    if (y !== lastY || x !== lastX + 1) {
                         output += `\x1b[${y + 1};${x + 1}H`;
                    }
                    
                    // Update Style if needed
                    if (cell.style !== lastStyle) {
                        output += `\x1b[0m${cell.style}`; // Always reset first for safety
                        lastStyle = cell.style;
                    }

                    output += cell.char;
                    
                    lastY = y;
                    lastX = x;
                }
            }
        }

        if (output.length > 0) {
            // Reset style at end of batch to be safe
            // output += '\x1b[0m'; 
            process.stdout.write(output);
        }
    }

    /**
     * Gets current terminal dimensions.
     */
    static get size() {
        return {
            width: process.stdout.columns || 80,
            height: process.stdout.rows || 24
        };
    }

    /**
     * Listens for resize events with debounce to prevent flickering.
     * @param callback Function to call when resize finishes
     */
    static onResize(callback: () => void) {
        process.stdout.on('resize', () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }

            // Wait 100ms until user stops dragging window
            this.resizeTimeout = setTimeout(() => {
                // Re-init buffers
                this.resizeBuffers();
                callback();
            }, 100);
        });
    }
}
