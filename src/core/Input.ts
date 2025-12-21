// ==========================================
// CORE: INPUT MANAGER (The "Controller")
// ==========================================

import * as readline from 'readline';
import { Screen } from './Screen';

// Handler returns true to consume event (stop propagation)
export type KeyHandler = (key: readline.Key) => boolean | void;

export interface MouseEvent {
    name: 'mouse';
    x: number;
    y: number;
    button: 'left' | 'middle' | 'right' | 'release' | 'wheel-up' | 'wheel-down' | 'none';
    action: 'mousedown' | 'mouseup' | 'mousemove';
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
}

export type MouseHandler = (event: MouseEvent) => boolean | void;

export class Input {
    private static listeners: KeyHandler[] = [];
    private static mouseListeners: MouseHandler[] = [];
    private static initialized = false;

    static init() {
        if (this.initialized) return;

        readline.emitKeypressEvents(process.stdin);
        
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            // Enable mouse tracking: SGR mode (1006) + Move (1003) + Click (1000)
            // We use 1002 (Cell Motion) or 1003 (All Motion). Let's use 1000 for clicks initially, 1003 if we want hover.
            // Prompt says "click... select tab... scroll".
            // 1000 sends on click/release.
            // 1006 enables SGR (decimal) coordinates, avoiding issues with high coordinates.
            process.stdout.write('\x1b[?1000h\x1b[?1002h\x1b[?1006h\x1b[?1015h');
        }

        process.stdin.on('keypress', (str, key) => {
            // Check for Mouse Event (SGR format: \x1b[<0;x;yM or m)
            if (key.sequence && key.sequence.startsWith('\x1b[<')) {
                const match = key.sequence.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])/);
                if (match) {
                    const code = parseInt(match[1]);
                    const x = parseInt(match[2]) - 1; // 1-based to 0-based
                    const y = parseInt(match[3]) - 1;
                    const type = match[4]; // M = down, m = up

                    const event: MouseEvent = {
                        name: 'mouse',
                        x, y,
                        button: 'left', // Default
                        action: type === 'M' ? 'mousedown' : 'mouseup',
                        ctrl: false,
                        meta: false,
                        shift: false
                    };

                    // Decode 'code'
                    // 0 = Left, 1 = Middle, 2 = Right
                    // +4 = Shift, +8 = Meta, +16 = Ctrl
                    // +32 = Motion (drag)
                    // +64 = Scroll (wheel)

                    let btnCode = code;
                    
                    // Modifiers
                    if (btnCode >= 32) {
                        // Drag or Scroll
                        if (btnCode >= 64) {
                            event.button = btnCode === 64 ? 'wheel-up' : 'wheel-down'; // This is simplified
                            // Actually scroll is often 64 (up) or 65 (down).
                            // Let's refine based on common SGR usage.
                            if (btnCode === 64) event.button = 'wheel-up';
                            if (btnCode === 65) event.button = 'wheel-down';
                        } else {
                            // Drag
                            event.action = 'mousemove';
                            btnCode -= 32;
                        }
                    }

                    if (event.button !== 'wheel-up' && event.button !== 'wheel-down') {
                        if ((btnCode & 4) === 4) { event.shift = true; btnCode -= 4; }
                        if ((btnCode & 8) === 8) { event.meta = true; btnCode -= 8; }
                        if ((btnCode & 16) === 16) { event.ctrl = true; btnCode -= 16; }

                        if (btnCode === 0) event.button = 'left';
                        else if (btnCode === 1) event.button = 'middle';
                        else if (btnCode === 2) event.button = 'right';
                        else event.button = 'none'; // Maybe release
                    }

                    // Dispatch Mouse Event
                    // Iterate backwards
                    for (let i = this.mouseListeners.length - 1; i >= 0; i--) {
                        const consumed = this.mouseListeners[i](event);
                        if (consumed === true) break;
                    }
                    // Also trigger render
                    Screen.scheduleRender();
                    return;
                }
            }

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

    static onMouse(handler: MouseHandler) {
        this.init();
        this.mouseListeners.push(handler);
    }

    static offMouse(handler: MouseHandler) {
        this.mouseListeners = this.mouseListeners.filter(l => l !== handler);
    }

    /**
     * Stops listening and restores stdin.
     */
    static reset() {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
            // Disable mouse tracking
            process.stdout.write('\x1b[?1000l\x1b[?1002l\x1b[?1006l\x1b[?1015l');
        }
        process.stdin.pause();
        this.listeners = [];
        this.mouseListeners = [];
        this.initialized = false;
    }
}
