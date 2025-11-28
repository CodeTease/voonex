import { Styler, ColorName } from '../core/Styler';
import { Screen } from '../core/Screen';
import { Focusable } from '../core/Focus';
import * as readline from 'readline';

export interface SelectOptions {
    id: string;
    label?: string;
    items: string[];
    x: number;
    y: number;
    width?: number;
    onSelect?: (index: number, item: string) => void;
}

export class Select implements Focusable {
    public id: string;
    private options: SelectOptions;
    private selectedIndex: number = 0;
    private isFocused: boolean = false;
    private isOpen: boolean = false;

    constructor(options: SelectOptions) {
        this.id = options.id;
        this.options = { width: 20, ...options };
    }

    focus() {
        this.isFocused = true;
        this.render();
    }

    blur() {
        this.isFocused = false;
        if (this.isOpen) {
            this.isOpen = false;
            this.clearDropdownArea(); // Clear artifacts
        }
        this.render();
    }

    handleKey(key: readline.Key): boolean {
        if (!this.isFocused) return false;

        if (this.isOpen) {
            // Dropdown navigation
            if (key.name === 'up') {
                this.selectedIndex = (this.selectedIndex - 1 + this.options.items.length) % this.options.items.length;
                this.render();
                return true;
            } else if (key.name === 'down') {
                this.selectedIndex = (this.selectedIndex + 1) % this.options.items.length;
                this.render();
                return true;
            } else if (key.name === 'return' || key.name === 'enter' || key.name === 'escape') {
                this.isOpen = false;
                this.clearDropdownArea(); // Clear artifacts
                if (key.name !== 'escape' && this.options.onSelect) {
                    this.options.onSelect(this.selectedIndex, this.options.items[this.selectedIndex]);
                }
                this.render();
                return true;
            }
        } else {
            // Closed state navigation
            if (key.name === 'return' || key.name === 'enter' || key.name === 'space') {
                this.isOpen = true;
                this.render();
                return true;
            }
             // Optional: Allow arrows to cycle through items without opening?
             // Usually selects allow this.
             if (key.name === 'down') {
                 this.selectedIndex = (this.selectedIndex + 1) % this.options.items.length;
                 if (this.options.onSelect) this.options.onSelect(this.selectedIndex, this.options.items[this.selectedIndex]);
                 this.render();
                 return true;
             }
             if (key.name === 'up') {
                 this.selectedIndex = (this.selectedIndex - 1 + this.options.items.length) % this.options.items.length;
                 if (this.options.onSelect) this.options.onSelect(this.selectedIndex, this.options.items[this.selectedIndex]);
                 this.render();
                 return true;
             }
        }

        return false;
    }

    private clearDropdownArea() {
        const { x, y, width, items, label } = this.options;
        const w = width || 20;
        const labelText = label ? `${label}: ` : '';
        const inputX = x + labelText.length;
        
        // Clear the exact area where dropdown items were drawn
        for (let i = 0; i < items.length; i++) {
            const itemY = y + 1 + i;
            // Write spaces to clear. We use ' ' * w.
            // This might wipe underlying content, but it removes the ghost text.
            Screen.write(inputX, itemY, ' '.repeat(w));
        }
    }

    render() {
        const { x, y, width, label, items } = this.options;
        const w = width || 20;
        
        const labelText = label ? `${label}: ` : '';
        const labelLen = labelText.length;

        if (label) {
             const labelStyle = this.isFocused ? 'brightCyan' : 'white'; 
             // If not focused, make it dim using modifier
             if (this.isFocused) {
                 Screen.write(x, y, Styler.style(labelText, 'brightCyan', 'bold'));
             } else {
                 Screen.write(x, y, Styler.style(labelText, 'white', 'dim'));
             }
        }

        const inputX = x + labelLen;
        const selectedItem = items[this.selectedIndex] || "";
        const arrow = this.isOpen ? '▲' : '▼';
        
        // Draw the main box
        const content = ` ${selectedItem} `.padEnd(w - 2) + arrow + ' ';
        const style: ColorName = this.isFocused ? 'bgBlue' : 'bgWhite';
        const fg: ColorName = this.isFocused ? 'white' : 'black';
        
        Screen.write(inputX, y, Styler.style(content, style, fg));

        // Draw Dropdown if open
        if (this.isOpen) {
            for (let i = 0; i < items.length; i++) {
                const itemY = y + 1 + i;
                const isSelected = i === this.selectedIndex;
                const itemContent = ` ${items[i]} `.padEnd(w);
                
                const itemStyle: ColorName = isSelected ? 'bgCyan' : 'bgWhite'; 
                const itemFg: ColorName = isSelected ? 'black' : 'black';
                
                Screen.write(inputX, itemY, Styler.style(itemContent, itemStyle, itemFg));
            }
        }
    }
}