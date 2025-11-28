// ==========================================
// CORE: SCREEN MANAGER (The "Canvas")
// ==========================================

import { Cursor } from './Cursor';

export class Screen {
    private static isAlternateBuffer = false;
    private static resizeTimeout: NodeJS.Timeout | null = null;

    /**
     * Enters the Alternate Screen Buffer (like Vim or Nano).
     */
    static enter() {
        if (this.isAlternateBuffer) return;
        process.stdout.write('\x1b[?1049h'); // Enter alternate buffer
        Cursor.hide();
        this.isAlternateBuffer = true;
    }

    /**
     * Leaves the Alternate Screen Buffer and restores cursor.
     */
    static leave() {
        if (!this.isAlternateBuffer) return;
        Cursor.show();
        process.stdout.write('\x1b[?1049l'); // Leave alternate buffer
        this.isAlternateBuffer = false;
    }

    /**
     * Writes text at a specific coordinate.
     */
    static write(x: number, y: number, text: string) {
        // Safety check: Don't draw outside current bounds to prevent weird wrapping
        if (x >= process.stdout.columns || y >= process.stdout.rows) return;
        
        Cursor.moveTo(x, y);
        process.stdout.write(text);
    }

    /**
     * Clears the entire screen immediately.
     */
    static clear() {
        Cursor.clearScreen();
    }

    /**
     * Gets current terminal dimensions.
     */
    static get size() {
        return {
            width: process.stdout.columns,
            height: process.stdout.rows
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
                // Clear artifacts from previous size
                this.clear();
                // Trigger re-render
                callback();
            }, 100);
        });
    }
}