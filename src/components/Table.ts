import { Styler } from '../core/Styler';
import { Screen } from '../core/Screen';

interface TableOptions {
    x?: number;
    y?: number;
}

export class Table {
    private headers: string[];
    private rows: string[][] = [];
    private options: TableOptions;

    constructor(headers: string[], options: TableOptions = {}) {
        this.headers = headers;
        this.options = { x: 1, y: 1, ...options };
    }

    addRow(row: string[]) {
        this.rows.push(row);
    }

    render() {
        const startX = this.options.x || 1;
        let currentY = this.options.y || 1;

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
                return isHeader ? Styler.style(cell, 'bold', 'blue') : cell;
            }).join('│');
        };

        const separator = colWidths.map(w => '─'.repeat(w)).join('┼');

        // Draw Header
        Screen.write(startX, currentY++, buildRow(this.headers, true));
        Screen.write(startX, currentY++, Styler.style(separator, 'dim'));
        
        // Draw Rows
        this.rows.forEach(row => {
            Screen.write(startX, currentY++, buildRow(row));
        });
    }
}