import { Styler } from '../core/Styler';
import { Screen } from '../core/Screen';
import { Focusable } from '../core/Focus';
import * as readline from 'readline';

interface TableOptions {
    id?: string;
    x?: number;
    y?: number;
    height?: number;
    width?: number; // Optional force width? Usually calculated from content
    scrollable?: boolean;
}

export class Table implements Focusable {
    public id: string;
    private headers: string[];
    private rows: string[][] = [];
    private options: TableOptions;
    private scrollTop: number = 0;
    private isFocused: boolean = false;

    constructor(headers: string[], options: TableOptions = {}) {
        this.headers = headers;
        this.id = options.id || `table-${Math.random().toString(36).substr(2, 9)}`;
        this.options = { x: 1, y: 1, scrollable: true, ...options };
    }

    addRow(row: string[]) {
        this.rows.push(row);
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
        if (!this.options.scrollable) return false;

        const maxScroll = Math.max(0, this.rows.length - (this.options.height ? this.options.height - 4 : this.rows.length)); 
        // Height - header (1) - separator (1) - border/margin? 
        // Let's refine calculation in render, but basically:
        // Visible rows = height - 2 (header + sep)
        
        const visibleRows = (this.options.height || this.rows.length + 2) - 2;

        if (key.name === 'up') {
            if (this.scrollTop > 0) {
                this.scrollTop--;
                this.render();
                return true;
            }
        } else if (key.name === 'down') {
            if (this.scrollTop < maxScroll) {
                this.scrollTop++;
                this.render();
                return true;
            }
        } else if (key.name === 'pageup') {
            this.scrollTop = Math.max(0, this.scrollTop - visibleRows);
            this.render();
            return true;
        } else if (key.name === 'pagedown') {
            this.scrollTop = Math.min(maxScroll, this.scrollTop + visibleRows);
            this.render();
            return true;
        }

        return false;
    }

    render() {
        const startX = this.options.x || 1;
        let currentY = this.options.y || 1;
        const height = this.options.height;

        // Calculate column widths
        const colWidths = this.headers.map((h, i) => {
            const maxRow = Math.max(...this.rows.map(r => Styler.len(r[i] || '')));
            return Math.max(Styler.len(h), maxRow) + 2; 
        });

        const buildRow = (items: string[], isHeader = false) => {
            return items.map((item, i) => {
                const len = Styler.len(item);
                const pad = ' '.repeat(colWidths[i] - len - 1); 
                const cell = ` ${item}${pad}`;
                const style = isHeader ? 'blue' : (this.isFocused ? 'white' : 'gray');
                return isHeader ? Styler.style(cell, 'bold', 'blue') : Styler.style(cell, style);
            }).join('│');
        };

        const totalWidth = colWidths.reduce((a, b) => a + b, 0) + (colWidths.length - 1);
        const separator = colWidths.map(w => '─'.repeat(w)).join('┼');
        
        // Draw Header
        Screen.write(startX, currentY++, buildRow(this.headers, true));
        Screen.write(startX, currentY++, Styler.style(separator, 'dim'));
        
        // Determine visible rows
        let visibleRowsCount = this.rows.length;
        if (height) {
            visibleRowsCount = height - 2; // Subtract header and separator
        }

        for (let i = 0; i < visibleRowsCount; i++) {
            const rowIndex = i + this.scrollTop;
            if (rowIndex < this.rows.length) {
                let rowStr = buildRow(this.rows[rowIndex]);
                
                // Add Scrollbar indicator if needed
                if (this.options.scrollable && height && this.rows.length > visibleRowsCount) {
                    const scrollbarHeight = Math.max(1, Math.floor((visibleRowsCount / this.rows.length) * visibleRowsCount));
                     const maxScroll = this.rows.length - visibleRowsCount;
                     const scrollPercent = this.scrollTop / maxScroll;
                     const scrollPos = Math.floor(scrollPercent * (visibleRowsCount - scrollbarHeight));

                     if (i >= scrollPos && i < scrollPos + scrollbarHeight) {
                         rowStr += Styler.style('│', 'brightWhite');
                     } else {
                         rowStr += Styler.style('│', 'dim');
                     }
                }

                Screen.write(startX, currentY++, rowStr);
            } else {
                // Clear empty lines if height is fixed
                if (height) {
                    Screen.write(startX, currentY++, ' '.repeat(totalWidth + 1));
                }
            }
        }
    }
}