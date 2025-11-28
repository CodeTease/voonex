// ==========================================
// CORE: CURSOR MANAGEMENT
// ==========================================

import * as readline from 'readline';

export class Cursor {
    static hide() {
        process.stdout.write('\x1b[?25l');
    }

    static show() {
        process.stdout.write('\x1b[?25h');
    }

    static moveTo(x: number, y: number) {
        readline.cursorTo(process.stdout, x, y);
    }

    static clearLine() {
        readline.clearLine(process.stdout, 0);
    }

    static clearScreen() {
        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);
    }
}