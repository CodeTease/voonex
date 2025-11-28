import { Styler } from '../core/Styler';
import { Screen } from '../core/Screen';
import { Focusable } from '../core/Focus';
import * as readline from 'readline';

export interface RadioGroupOptions {
    id: string; // Group ID
    label?: string;
    items: string[];
    selectedIndex?: number;
    x: number;
    y: number;
    direction?: 'horizontal' | 'vertical'; // Default vertical
}

export class RadioGroup implements Focusable {
    public id: string;
    public selectedIndex: number;
    private options: RadioGroupOptions;
    private isFocused: boolean = false;

    constructor(options: RadioGroupOptions) {
        this.id = options.id;
        this.options = { direction: 'vertical', ...options };
        this.selectedIndex = options.selectedIndex || 0;
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

        const count = this.options.items.length;

        if (key.name === 'up' || key.name === 'left') {
            this.selectedIndex = (this.selectedIndex - 1 + count) % count;
            this.render();
            return true;
        } else if (key.name === 'down' || key.name === 'right') {
            this.selectedIndex = (this.selectedIndex + 1) % count;
            this.render();
            return true;
        }

        return false;
    }

    render() {
        const { x, y, label, items, direction } = this.options;
        let currentX = x;
        let currentY = y;

        if (label) {
            Screen.write(currentX, currentY, Styler.style(label + ':', 'bold'));
            if (direction === 'vertical') currentY++;
            else currentX += label.length + 2;
        }

        items.forEach((item, index) => {
            const isSelected = index === this.selectedIndex;
            const symbol = isSelected ? '(*)' : '( )';
            const symbolColor = isSelected ? 'green' : 'dim';
            const textColor = this.isFocused && isSelected ? 'brightCyan' : (this.isFocused ? 'white' : 'gray');
            
            const content = Styler.style(symbol, symbolColor) + ' ' + Styler.style(item, textColor);
            
            Screen.write(currentX, currentY, content);

            if (direction === 'vertical') {
                currentY++;
            } else {
                currentX += item.length + 6; // spacing
            }
        });
    }
}