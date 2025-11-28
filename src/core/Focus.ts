import * as readline from 'readline';

export interface Focusable {
    id: string;
    focus(): void;
    blur(): void;
    handleKey(key: readline.Key): boolean | void; // Return true if key is consumed
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

        // === COMPONENT LOGIC ===
        // Give the active component a chance to consume the key first
        const activeComponent = this.components[this.activeIndex];
        let consumed = false;
        if (activeComponent) {
            const result = activeComponent.handleKey(key);
            consumed = result === true;
        }

        if (consumed) {
            return;
        }

        // === NAVIGATION LOGIC ===
        
        // Next: Tab
        if (key.name === 'tab' && !key.shift) {
            this.cycleFocus(false);
            return;
        }
        // Fallback: Down/Right for next (if not consumed by component)
        if (key.name === 'down' || key.name === 'right') {
            this.cycleFocus(false);
            return;
        }

        // Previous: Shift+Tab
        if (key.name === 'tab' && key.shift) {
            this.cycleFocus(true);
            return;
        }
        // Fallback: Up/Left for previous (if not consumed by component)
        if (key.name === 'up' || key.name === 'left') {
            this.cycleFocus(true);
            return;
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