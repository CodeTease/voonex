import { Screen } from '../core/Screen';
import { Styler } from '../core/Styler';
import { Focusable, FocusManager } from '../core/Focus';
import * as readline from 'readline';

export interface TabOptions {
    id: string;
    titles: string[];
    x: number;
    y: number;
    width: number;
    height: number; // Height of the panel area
    initialTab?: number;
    // Map tab index to a list of components that should be active when that tab is selected
    // Note: TabManager won't render the content components automatically unless we integrate deeper.
    // Instead, TabManager will emit an event or call a callback when tab changes, and the user code
    // is responsible for rendering the correct content, OR TabManager manages visibility.
    // For TUI, managing visibility usually means re-rendering.
    onTabChange?: (index: number) => void;
}

export class TabManager implements Focusable {
    public id: string;
    private options: TabOptions;
    private activeIndex: number = 0;
    private isFocused: boolean = false;

    constructor(options: TabOptions) {
        this.id = options.id;
        this.options = options;
        this.activeIndex = options.initialTab || 0;
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
        
        // Left/Right arrows to switch tabs
        if (key.name === 'left') {
            this.activeIndex = (this.activeIndex - 1 + this.options.titles.length) % this.options.titles.length;
            this.triggerChange();
            this.render();
            return true;
        } else if (key.name === 'right') {
            this.activeIndex = (this.activeIndex + 1) % this.options.titles.length;
            this.triggerChange();
            this.render();
            return true;
        }

        return false;
    }

    private triggerChange() {
        if (this.options.onTabChange) {
            this.options.onTabChange(this.activeIndex);
        }
    }

    render() {
        const { x, y, width, titles } = this.options;

        // Draw Tabs Row
        let currentX = x;
        titles.forEach((title, index) => {
            const isActive = index === this.activeIndex;
            const style = isActive ? (this.isFocused ? 'brightCyan' : 'white') : 'dim';
            const decoration = isActive ? 'bold' : 'dim';
            
            const displayTitle = ` ${title} `;
            // Draw top border for active tab or something distinct?
            // Simple style: [ Active ]  Inactive 
            
            let renderStr = displayTitle;
            if (isActive) {
                renderStr = Styler.style(displayTitle, 'bgBlue', 'white', 'bold');
            } else {
                renderStr = Styler.style(displayTitle, 'dim', 'bgBlack');
            }

            Screen.write(currentX, y, renderStr);
            currentX += Styler.len(displayTitle) + 1;
        });

        // Draw separator line below tabs
        Screen.write(x, y + 1, Styler.style('─'.repeat(width), 'dim'));
        
        // Ideally, we might want to clear the content area below if the user handles it manually?
        // Or we assume the user's `onTabChange` will re-render the content area.
    }
}