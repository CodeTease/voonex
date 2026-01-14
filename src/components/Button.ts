import { Styler, ColorName } from '../core/Styler';
import { Screen } from '../core/Screen';
import { Component } from '../core/Component';
import { Focusable } from '../core/Focus';
import { createSignal } from '../core/Signal';
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

export class Button extends Component implements Focusable {
    public id: string;
    public parent?: Focusable;
    private options: ButtonOptions;
    
    // State managed by signals (implicit render on change)
    private isFocusedSignal = createSignal(false);
    private isPressedSignal = createSignal(false);

    // Getters/Setters for convenience
    private get isFocused() { return this.isFocusedSignal[0](); }
    private set isFocused(v: boolean) { this.isFocusedSignal[1](v); }

    private get isPressed() { return this.isPressedSignal[0](); }
    private set isPressed(v: boolean) { this.isPressedSignal[1](v); }

    constructor(options: ButtonOptions) {
        super();
        this.id = options.id;
        this.options = { style: 'brackets', ...options };
    }

    focus() {
        this.isFocused = true;
        // No need to call render(), signal handles it
    }

    blur() {
        this.isFocused = false;
        this.isPressed = false;
        // No need to call render(), signal handles it
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
        // render triggered by signal

        // Trigger action slightly delayed to show visual feedback
        setTimeout(() => {
            this.isPressed = false;
            this.options.onPress();
        }, 150);
    }

    render() {
        const { x, y, text, width } = this.options;
        
        // Reading signals here (isFocused, isPressed) creates the dependency
        // although in our simple system, any signal write triggers global render.
        
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
