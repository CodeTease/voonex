import { Styler } from '../core/Styler';
import { Screen } from '../core/Screen';
import { Focusable } from '../core/Focus';
import * as readline from 'readline';

export interface CheckboxOptions {
    id: string;
    label: string;
    checked?: boolean;
    x: number;
    y: number;
}

export class Checkbox implements Focusable {
    public id: string;
    public checked: boolean;
    private options: CheckboxOptions;
    private isFocused: boolean = false;

    constructor(options: CheckboxOptions) {
        this.id = options.id;
        this.options = options;
        this.checked = options.checked || false;
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

        if (key.name === 'space' || key.name === 'return' || key.name === 'enter') {
            this.checked = !this.checked;
            this.render();
            return true;
        }

        return false;
    }

    render() {
        const { x, y, label } = this.options;
        const box = this.checked ? '[x]' : '[ ]';
        const style = this.isFocused ? 'brightCyan' : 'white';
        const boxStyle = this.checked ? 'green' : 'dim';
        
        const content = Styler.style(box, boxStyle) + ' ' + Styler.style(label, style);
        Screen.write(x, y, content);
    }
}
