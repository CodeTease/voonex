import { Styler, ColorName } from '../core/Styler';
import { Screen } from '../core/Screen';
import { Focusable } from '../core/Focus';
import * as readline from 'readline';

interface ButtonOptions {
    id: string;
    text: string;
    x: number;
    y: number;
    width?: number; // Optional fixed width
    style?: 'simple' | 'brackets'; // [ OK ] vs  OK 
    onPress: () => void;
}

export class Button implements Focusable {
    public id: string;
    private options: ButtonOptions;
    private isFocused: boolean = false;
    private isPressed: boolean = false; // For visual feedback

    constructor(options: ButtonOptions) {
        this.id = options.id;
        this.options = { style: 'brackets', ...options };
    }

    focus() {
        this.isFocused = true;
        this.render(); // Ensure render called on focus
    }

    blur() {
        this.isFocused = false;
        this.isPressed = false;
        this.render();
    }

    handleKey(key: readline.Key): boolean {
        if (!this.isFocused) return false;

        if (key.name === 'return' || key.name === 'enter' || key.name === 'space') {
            this.triggerPress();
            return true;
        }
        return false;
    }

    private triggerPress() {
        this.isPressed = true;
        this.render(); // Show pressed state visually

        // Trigger action slightly delayed to show visual feedback
        setTimeout(() => {
            this.isPressed = false;
            this.render();
            this.options.onPress();
        }, 150);
    }

    render() {
        const { x, y, text, width } = this.options;
        
        let label = text;
        // Simple visual centering if width is provided
        if (width) {
            const pad = Math.max(0, width - text.length);
            const padLeft = Math.floor(pad / 2);
            const padRight = pad - padLeft;
            label = ' '.repeat(padLeft) + text + ' '.repeat(padRight);
        }

        let renderedText = "";
        let color: ColorName = 'white';
        let bgStyle: ColorName | '' = '';

        if (this.isFocused) {
            color = this.isPressed ? 'black' : 'white'; 
            bgStyle = this.isPressed ? 'bgGreen' : 'bgBlue'; // Green when clicked, Blue when focused
            
            if (this.options.style === 'brackets') {
                renderedText = `[ ${label} ]`;
            } else {
                renderedText = `  ${label}  `;
            }
            
            // Apply styles
            // Note: Styler.style takes varargs, we need to handle types carefully or cast
            Screen.write(x, y, Styler.style(renderedText, color, 'bold', bgStyle as any));
        } else {
            // Normal State
            if (this.options.style === 'brackets') {
                renderedText = `[ ${label} ]`;
            } else {
                renderedText = `  ${label}  `;
            }
            Screen.write(x, y, Styler.style(renderedText, 'dim'));
        }
    }
}
