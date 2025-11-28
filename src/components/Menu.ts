import { Input } from '../core/Input';
import { Screen } from '../core/Screen';
import { Styler } from '../core/Styler';
import { Cursor } from '../core/Cursor';
import { Focusable } from '../core/Focus';
import * as readline from 'readline';

interface MenuOptions {
    id?: string;
    title?: string;
    items: string[];
    onSelect: (index: number, item: string) => void;
    x?: number; 
    y?: number;
}

export class Menu implements Focusable {
    public id: string;
    private selectedIndex = 0;
    private options: MenuOptions;
    private active = false; // "Active" in standalone mode, or used for "Focused" logic?
    private isFocused = false;

    constructor(options: MenuOptions) {
        this.id = options.id || `menu-${Math.random().toString(36).substr(2, 9)}`;
        this.options = options;
        this.options.x = options.x || 2;
        this.options.y = options.y || 2;
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
        if (!this.isFocused && !this.active) return false;

        let consumed = false;

        switch (key.name) {
            case 'up':
                this.selectedIndex = (this.selectedIndex - 1 + this.options.items.length) % this.options.items.length;
                this.render();
                consumed = true;
                break;
            case 'down':
                this.selectedIndex = (this.selectedIndex + 1) % this.options.items.length;
                this.render();
                consumed = true;
                break;
            case 'return': // Enter key
            case 'enter':
                //this.active = false; // Don't deactivate if managed by FocusManager?
                // Provide visual feedback
                // We should probably just call select
                this.options.onSelect(this.selectedIndex, this.options.items[this.selectedIndex]);
                consumed = true;
                break;
            case 'escape':
                // Maybe defocus or exit?
                break;
        }

        return consumed;
    }

    render() {
        const { x, y, items, title } = this.options;
        
        if (title) {
            Screen.write(x!, y!, Styler.style(title, 'bold', 'underline'));
        }

        items.forEach((item, index) => {
            const isSelected = index === this.selectedIndex;
            // Show different cursor if focused
            const prefix = isSelected ? (this.isFocused || this.active ? '❯ ' : '> ') : '  ';
            
            let style: any[] = ['dim'];
            if (isSelected) {
                style = this.isFocused || this.active ? ['cyan', 'bold'] : ['white'];
            }

            const label = Styler.style(item, ...style);
            
            // +1 (or +2) for title offset
            Screen.write(x!, y! + index + (title ? 2 : 0), `${prefix}${label}`);
        });
    }

    /**
     * Legacy Standalone Start
     */
    start() {
        this.active = true;
        Cursor.hide(); // Hide cursor for cleaner UI
        this.render();

        // This effectively takes over input globally, effectively "Mocking" FocusManager for this single component
        Input.onKey((key) => {
            if (!this.active) return;
            // Re-use logic
            const consumed = this.handleKey(key);
            
            if (key.name === 'q' || key.name === 'escape') {
                this.active = false;
                process.exit(0);
            }
        });
    }
}