// ==========================================
// CORE: INPUT MANAGER (The "Controller")
// ==========================================

import * as readline from 'readline';

export type KeyHandler = (key: readline.Key) => void;

export class Input {
    private static listeners: KeyHandler[] = [];
    private static initialized = false;

    static init() {
        if (this.initialized) return;

        readline.emitKeypressEvents(process.stdin);
        
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }

        process.stdin.on('keypress', (str, key) => {
            // Handle Ctrl+C globally to prevent trapping the user
            if (key.ctrl && key.name === 'c') {
                process.exit();
            }

            this.listeners.forEach(listener => listener(key));
        });

        this.initialized = true;
    }

    static onKey(handler: KeyHandler) {
        this.init();
        this.listeners.push(handler);
    }

    /**
     * Stops listening and restores stdin.
     */
    static reset() {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        this.listeners = [];
        this.initialized = false;
    }
}