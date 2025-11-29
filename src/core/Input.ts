// ==========================================
// CORE: INPUT MANAGER (The "Controller")
// ==========================================

import * as readline from 'readline';
import { Screen } from './Screen';

// Handler returns true to consume event (stop propagation)
export type KeyHandler = (key: readline.Key) => boolean | void;

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
                Screen.leave(); // Restore terminal state
                process.exit();
            }

            // Iterate backwards so newest listeners (e.g. Popups) get first dibs
            for (let i = this.listeners.length - 1; i >= 0; i--) {
                const consumed = this.listeners[i](key);
                if (consumed === true) break;
            }
            
            // Trigger a render check after input handling
            Screen.scheduleRender();
        });

        this.initialized = true;
    }

    static onKey(handler: KeyHandler) {
        this.init();
        this.listeners.push(handler);
    }

    static offKey(handler: KeyHandler) {
        this.listeners = this.listeners.filter(l => l !== handler);
    }

    /**
     * Stops listening and restores stdin.
     */
    static reset() {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        process.stdin.pause();
        this.listeners = [];
        this.initialized = false;
    }
}
