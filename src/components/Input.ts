import { Styler, ColorName } from '../core/Styler';
import { Screen } from '../core/Screen';
import { Focusable } from '../core/Focus';
import * as readline from 'readline';

export interface InputOptions {
    id: string; // New: ID is required for Focus Manager
    label?: string;
    placeholder?: string;
    x: number;
    y: number;
    width?: number;
    type?: 'text' | 'password';
}

export class InputField implements Focusable {
    public id: string;
    public value: string = "";
    private isFocused: boolean = false;
    private options: InputOptions;
    
    // New properties for editing
    private cursorIndex: number = 0;
    private scrollOffset: number = 0;

    constructor(options: InputOptions) {
        this.id = options.id;
        this.options = { width: 30, type: 'text', ...options };
    }

    focus() {
        this.isFocused = true;
        this.render();
    }

    blur() {
        this.isFocused = false;
        this.render();
    }

    setValue(val: string) {
        this.value = val;
        this.cursorIndex = val.length;
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
        } else if (key.name === 'delete') { // Forward delete
            if (this.cursorIndex < this.value.length) {
                this.value = this.value.slice(0, this.cursorIndex) + this.value.slice(this.cursorIndex + 1);
                consumed = true;
            }
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
        } else if (key.name === 'home') {
            if (this.cursorIndex > 0) {
                this.cursorIndex = 0;
                consumed = true;
            }
        } else if (key.name === 'end') {
            if (this.cursorIndex < this.value.length) {
                this.cursorIndex = this.value.length;
                consumed = true;
            }
        } else if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
            // Basic text input filtering
            if (/^[\x20-\x7E]$/.test(key.sequence)) {
                this.value = this.value.slice(0, this.cursorIndex) + key.sequence + this.value.slice(this.cursorIndex);
                this.cursorIndex++;
                consumed = true;
            }
        }
        
        if (consumed) {
            this.render();
            return true;
        }

        // Did not consume (e.g., arrow keys, tabs)
        return false;
    }

    render() {
        const { x, y, label, width, type } = this.options;
        const labelText = label ? `${label}: ` : '';
        const labelLen = labelText.length;
        
        // Draw Label
        if (label) {
            const labelStyle = this.isFocused ? 'brightCyan' : 'dim';
            Screen.write(x, y, Styler.style(labelText, labelStyle, 'bold'));
        }

        // Draw Input Box Background
        const inputX = x + labelLen;
        const maxWidth = (width || 30) - labelLen;
        
        // Adjust scrollOffset to keep cursor in view
        if (this.cursorIndex < this.scrollOffset) {
            this.scrollOffset = this.cursorIndex;
        } else if (this.cursorIndex >= this.scrollOffset + maxWidth) {
            this.scrollOffset = this.cursorIndex - maxWidth + 1;
        }
        // Clamp scrollOffset
        if (this.scrollOffset < 0) this.scrollOffset = 0;

        let displayValue = this.value.substring(this.scrollOffset, this.scrollOffset + maxWidth);
        
        if (type === 'password') {
            displayValue = '*'.repeat(displayValue.length);
        }

        // Prepare content with cursor
        let renderedContent = "";
        const cursorRelPos = this.cursorIndex - this.scrollOffset;

        // Iterate through visible area
        for (let i = 0; i < maxWidth; i++) {
            const charIndex = this.scrollOffset + i;
            let char = "";
            
            if (charIndex < this.value.length) {
                char = type === 'password' ? '*' : this.value[charIndex];
            } else {
                char = " ";
            }

            if (this.isFocused && i === cursorRelPos) {
                // Draw cursor
                renderedContent += Styler.style(char === " " ? " " : char, 'bgGreen', 'black');
            } else {
                renderedContent += char;
            }
        }

        // If cursor is at the very end (past last char), we need to handle it
        // The loop above goes up to maxWidth.
        // If cursorRelPos == displayValue.length, it might be drawn?
        // Actually the loop ensures we draw maxWidth chars.
        
        const style: ColorName = this.isFocused ? 'white' : 'gray';
        
        Screen.write(inputX, y, Styler.style(renderedContent, style));
        
        // Underline
        const underline = '─'.repeat(maxWidth);
        const underlineColor = this.isFocused ? 'brightGreen' : 'dim';
        Screen.write(inputX, y + 1, Styler.style(underline, underlineColor));
    }
}
