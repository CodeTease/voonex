import * as readline from 'readline';

export interface Focusable {
    id: string;
    focus(): void;
    blur(): void;
    handleKey(key: readline.Key): void; 
    render(): void;
}

export class FocusManager {
    private components: Focusable[] = [];
    private activeIndex: number = 0;

    register(component: Focusable) {
        this.components.push(component);
        if (this.components.length === 1) {
            component.focus();
            this.activeIndex = 0;
        }
    }

    handleKey(key: readline.Key) {
        if (this.components.length === 0) return;

        // === NAVIGATION LOGIC ===
        
        // Next: Tab, Down, Right
        if (key.name === 'tab' && !key.shift) {
            this.cycleFocus(false);
            return;
        }
        if (key.name === 'down' || key.name === 'right') {
            this.cycleFocus(false);
            return;
        }

        // Previous: Shift+Tab, Up, Left
        if (key.name === 'tab' && key.shift) {
            this.cycleFocus(true);
            return;
        }
        if (key.name === 'up' || key.name === 'left') {
            this.cycleFocus(true);
            return;
        }

        // === COMPONENT LOGIC ===
        const activeComponent = this.components[this.activeIndex];
        if (activeComponent) {
            activeComponent.handleKey(key);
        }
    }

    private cycleFocus(reverse: boolean = false) {
        this.components[this.activeIndex].blur();
        this.components[this.activeIndex].render(); 

        if (reverse) {
            this.activeIndex = (this.activeIndex - 1 + this.components.length) % this.components.length;
        } else {
            this.activeIndex = (this.activeIndex + 1) % this.components.length;
        }

        this.components[this.activeIndex].focus();
        this.components[this.activeIndex].render();
    }
}