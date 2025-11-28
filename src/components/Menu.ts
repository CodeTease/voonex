import { Input } from '../core/Input';
import { Screen } from '../core/Screen';
import { Styler } from '../core/Styler';
import { Cursor } from '../core/Cursor';

interface MenuOptions {
    title?: string;
    items: string[];
    onSelect: (index: number, item: string) => void;
    x?: number; 
    y?: number;
}

export class Menu {
    private selectedIndex = 0;
    private options: MenuOptions;
    private active = false;

    constructor(options: MenuOptions) {
        this.options = options;
        this.options.x = options.x || 2;
        this.options.y = options.y || 2;
    }

    render() {
        const { x, y, items, title } = this.options;
        
        if (title) {
            Screen.write(x!, y!, Styler.style(title, 'bold', 'underline'));
        }

        items.forEach((item, index) => {
            const isSelected = index === this.selectedIndex;
            const prefix = isSelected ? '❯ ' : '  ';
            const label = isSelected 
                ? Styler.style(item, 'cyan', 'bold') 
                : Styler.style(item, 'dim');
            
            // +1 (or +2) for title offset
            Screen.write(x!, y! + index + (title ? 2 : 0), `${prefix}${label}`);
        });
    }

    start() {
        this.active = true;
        Cursor.hide(); // Hide cursor for cleaner UI
        this.render();

        Input.onKey((key) => {
            if (!this.active) return;

            switch (key.name) {
                case 'up':
                    this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                    this.render();
                    break;
                case 'down':
                    this.selectedIndex = Math.min(this.options.items.length - 1, this.selectedIndex + 1);
                    this.render();
                    break;
                case 'return': // Enter key
                case 'enter':
                    this.active = false;
                    // Provide visual feedback
                    const selectedY = (this.options.y || 2) + this.selectedIndex + (this.options.title ? 2 : 0);
                    Screen.write(this.options.x!, selectedY, Styler.style(`✔ ${this.options.items[this.selectedIndex]}`, 'green', 'bold'));
                    
                    // Delay slightly before callback to show the "Tick"
                    setTimeout(() => {
                        this.options.onSelect(this.selectedIndex, this.options.items[this.selectedIndex]);
                    }, 200);
                    break;
                case 'escape':
                case 'q':
                    this.active = false;
                    process.exit(0);
                    break;
            }
        });
    }
}