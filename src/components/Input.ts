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
    
    constructor(options: InputOptions) {
        this.id = options.id;
        this.options = { width: 30, type: 'text', ...options };
    }

    focus() {
        this.isFocused = true;
    }

    blur() {
        this.isFocused = false;
    }

    setValue(val: string) {
        this.value = val;
    }

    handleKey(key: readline.Key): boolean {
        if (!this.isFocused) return false;

        if (key.name === 'backspace') {
            this.value = this.value.slice(0, -1);
            this.render();
            return true;
        } else if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
            // Basic text input filtering
            // Only accept printable characters (rough check)
            if (/^[\x20-\x7E]$/.test(key.sequence)) {
                this.value += key.sequence;
                this.render();
                return true;
            }
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
        
        let displayValue = this.value;
        if (type === 'password') {
            displayValue = '*'.repeat(this.value.length);
        }

        // Cursor logic
        const showCursor = this.isFocused;
        const cursorChar = '█'; 
        
        // Display content calculation
        // Ensure we don't overflow width
        if (displayValue.length >= maxWidth - 1) {
             const start = displayValue.length - (maxWidth - 2);
             displayValue = displayValue.substring(start);
        }

        const fieldContent = displayValue + (showCursor ? Styler.style(cursorChar, 'green') : ' ');
        // Fill remaining space to clear old chars
        const paddingLen = Math.max(0, maxWidth - Styler.len(fieldContent));
        const padding = ' '.repeat(paddingLen);
        
        const style: ColorName = this.isFocused ? 'white' : 'gray';
        
        Screen.write(inputX, y, Styler.style(fieldContent + padding, style));
        
        // Underline
        const underline = '─'.repeat(maxWidth);
        const underlineColor = this.isFocused ? 'brightGreen' : 'dim';
        Screen.write(inputX, y + 1, Styler.style(underline, underlineColor));
    }
}