import { Styler, ColorName } from '../core/Styler';
import { Screen } from '../core/Screen';
import { Focusable } from '../core/Focus';
import * as readline from 'readline';

export interface TextareaOptions {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    value?: string;
}

export class Textarea implements Focusable {
    public id: string;
    public value: string;
    private options: TextareaOptions;
    private isFocused: boolean = false;
    private cursorIndex: number = 0; // Absolute index in value
    private scrollTop: number = 0;   // Line offset

    constructor(options: TextareaOptions) {
        this.id = options.id;
        this.options = options;
        this.value = options.value || "";
        this.cursorIndex = this.value.length;
    }

    focus() {
        this.isFocused = true;
        this.render();
    }

    blur() {
        this.isFocused = false;
        this.render();
    }

    handleKey(key: readline.Key): boolean {
        if (!this.isFocused) return false;

        let consumed = false;

        if (key.name === 'backspace') {
            if (this.cursorIndex > 0) {
                this.value = this.value.slice(0, this.cursorIndex - 1) + this.value.slice(this.cursorIndex);
                this.cursorIndex--;
                consumed = true;
            }
        } else if (key.name === 'return' || key.name === 'enter') {
            this.value = this.value.slice(0, this.cursorIndex) + '\n' + this.value.slice(this.cursorIndex);
            this.cursorIndex++;
            consumed = true;
        } else if (key.name === 'left') {
            if (this.cursorIndex > 0) {
                this.cursorIndex--;
                consumed = true;
            }
        } else if (key.name === 'right') {
            if (this.cursorIndex < this.value.length) {
                this.cursorIndex++;
                consumed = true;
            }
        } else if (key.name === 'up') {
            // Move cursor up a line
            const currentLineStart = this.value.lastIndexOf('\n', this.cursorIndex - 1) + 1;
            const col = this.cursorIndex - currentLineStart;
            
            if (currentLineStart > 0) {
                const prevLineEnd = currentLineStart - 1;
                const prevLineStart = this.value.lastIndexOf('\n', prevLineEnd - 1) + 1;
                const prevLineLength = prevLineEnd - prevLineStart;
                
                this.cursorIndex = prevLineStart + Math.min(col, prevLineLength);
                consumed = true;
            }
        } else if (key.name === 'down') {
            // Move cursor down a line
            const nextLineStart = this.value.indexOf('\n', this.cursorIndex);
            if (nextLineStart !== -1) {
                const currentLineStart = this.value.lastIndexOf('\n', this.cursorIndex - 1) + 1;
                const col = this.cursorIndex - currentLineStart;
                const nextLineEnd = this.value.indexOf('\n', nextLineStart + 1);
                const actualNextLineEnd = nextLineEnd === -1 ? this.value.length : nextLineEnd;
                const nextLineLength = actualNextLineEnd - (nextLineStart + 1);
                
                this.cursorIndex = (nextLineStart + 1) + Math.min(col, nextLineLength);
                consumed = true;
            }
        } else if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
             if (/^[\x20-\x7E]$/.test(key.sequence)) {
                this.value = this.value.slice(0, this.cursorIndex) + key.sequence + this.value.slice(this.cursorIndex);
                this.cursorIndex++;
                consumed = true;
            }
        }

        if (consumed) {
            this.adjustScroll();
            this.render();
            return true;
        }
        return false;
    }

    private adjustScroll() {
        // Calculate which line the cursor is on
        const lines = this.value.split('\n');
        let charCount = 0;
        let cursorLine = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const lineLen = lines[i].length + 1; // +1 for newline
            if (this.cursorIndex < charCount + lineLen) {
                cursorLine = i;
                break;
            }
            charCount += lineLen;
        }
        // Special case: cursor at end of string which is a newline
        if (this.cursorIndex === this.value.length && this.value.endsWith('\n')) {
             cursorLine = lines.length; // Actually lines array might have empty string at end
             // If split('\n') on "a\n" gives ["a", ""]. Cursor at end is on line 1 (index 1).
             // Correct.
        }

        const visibleLines = this.options.height - 2; // Border
        
        if (cursorLine < this.scrollTop) {
            this.scrollTop = cursorLine;
        } else if (cursorLine >= this.scrollTop + visibleLines) {
            this.scrollTop = cursorLine - visibleLines + 1;
        }
    }

    render() {
        const { x, y, width, height, label } = this.options;
        const borderColor = this.isFocused ? 'brightCyan' : 'white';
        const innerWidth = width - 2;
        const innerHeight = height - 2;

        // Draw Label if provided
        if (label) {
             Screen.write(x, y - 1, Styler.style(label, 'bold'));
        }
        
        // Draw Box Border
        const top = '┌' + '─'.repeat(innerWidth) + '┐';
        const bottom = '└' + '─'.repeat(innerWidth) + '┘';
        
        Screen.write(x, y, Styler.style(top, borderColor));
        for (let i = 0; i < innerHeight; i++) {
             Screen.write(x, y + 1 + i, Styler.style('│' + ' '.repeat(innerWidth) + '│', borderColor));
        }
        Screen.write(x, y + height - 1, Styler.style(bottom, borderColor));

        // Draw Content
        const lines = this.value.split('\n');
        // We need to map cursorIndex to screen coordinates to draw the cursor character
        let charCounter = 0;
        
        for (let i = 0; i < innerHeight; i++) {
            const lineIndex = i + this.scrollTop;
            if (lineIndex < lines.length) {
                let lineStr = lines[lineIndex];
                // Truncate if too long (TODO: Horizontal scroll?)
                if (lineStr.length > innerWidth) {
                    lineStr = lineStr.substring(0, innerWidth);
                }

                // Check if cursor is on this line
                const lineStart = this.getLineStart(lines, lineIndex);
                const lineEnd = lineStart + lines[lineIndex].length;
                
                let displayStr = lineStr;
                
                if (this.isFocused && this.cursorIndex >= lineStart && this.cursorIndex <= lineEnd) {
                     // Cursor is on this line
                     const col = this.cursorIndex - lineStart;
                     if (col < innerWidth) {
                         const charAtCursor = lineStr[col] || ' ';
                         const before = lineStr.substring(0, col);
                         const after = lineStr.substring(col + 1);
                         displayStr = before + Styler.style(charAtCursor, 'bgGreen', 'black') + after;
                     }
                }
                
                // Pad to clear
                const remaining = innerWidth - Styler.len(displayStr);
                const finalStr = displayStr + ' '.repeat(Math.max(0, remaining));
                
                Screen.write(x + 1, y + 1 + i, finalStr);
            }
        }
    }
    
    private getLineStart(lines: string[], lineIndex: number): number {
        let start = 0;
        for (let i = 0; i < lineIndex; i++) {
            start += lines[i].length + 1;
        }
        return start;
    }
}