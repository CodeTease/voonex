import { Styler, ColorName } from '../core/Styler';
import { Screen } from '../core/Screen';
import { Focusable } from '../core/Focus';
import * as readline from 'readline';

export interface BoxOptions {
    id?: string; // New: Optional for static render, but useful if instantiated
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    padding?: number;
    borderColor?: ColorName;
    title?: string;
    style?: 'single' | 'double' | 'round';
    scrollable?: boolean;
    wrap?: boolean;
}

const BORDERS = {
    single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
    double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
    round:  { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' }
};

export class Box implements Focusable {
    public id: string;
    private options: BoxOptions;
    private content: string[];
    private processedLines: string[] = [];
    private scrollTop: number = 0;
    private isFocused: boolean = false;

    constructor(content: string | string[], options: BoxOptions = {}) {
        this.id = options.id || `box-${Math.random().toString(36).substr(2, 9)}`;
        this.options = {
            padding: 1,
            style: 'round',
            borderColor: 'white',
            scrollable: false,
            wrap: false,
            x: 1,
            y: 1,
            ...options
        };
        this.content = Array.isArray(content) ? content : content.split('\n');
        this.calculateDimensions();
        this.processContent();
    }

    private calculateDimensions() {
        const { padding } = this.options;
        const pad = padding || 1;

        // If width/height not provided, calculate from content
        if (!this.options.width) {
            const contentMaxWidth = Math.max(...this.content.map(l => Styler.len(l)));
            this.options.width = contentMaxWidth + (pad * 2) + 2;
        }

        if (!this.options.height) {
            this.options.height = this.content.length + (pad * 2) + 2;
        }
    }

    private processContent() {
        const { width, padding, wrap } = this.options;
        const pad = padding || 1;
        const innerWidth = (width || 0) - 2 - (pad * 2);

        if (wrap) {
            this.processedLines = [];
            for (const line of this.content) {
                if (Styler.len(line) <= innerWidth) {
                    this.processedLines.push(line);
                } else {
                    // Simple wrap logic
                    let currentLine = line;
                    while (Styler.len(currentLine) > innerWidth) {
                         // Find split point
                         // Note: This is a simple char split. Ideally split by words.
                         // But Styler.len handles ansi codes, so slicing directly is dangerous if codes exist.
                         // For now, assuming plain text or handled simply.
                         // Improving this requires a smarter wrapper that respects ANSI codes.
                         // Let's implement a basic word wrapper.
                         
                         const wrapped = this.wrapLine(currentLine, innerWidth);
                         this.processedLines.push(wrapped.head);
                         currentLine = wrapped.tail;
                    }
                    if (currentLine) this.processedLines.push(currentLine);
                }
            }
        } else {
            this.processedLines = this.content;
        }
    }

    private wrapLine(line: string, width: number): { head: string, tail: string } {
        // Updated implementation to use Styler.len (visual width) and Styler.truncate
        
        const raw = line; 
        const visualLen = Styler.len(raw);
        
        if (visualLen <= width) return { head: raw, tail: '' };
        
        // Try to find a space within the visual width
        // This logic is still simplified as searching for space by index vs visual position is tricky with mixed widths.
        // For now, let's just truncate at width to prevent overflow, ignoring word boundaries if complex.
        // Or we can try to find the last space that fits.
        
        // Let's first just truncate to fit width exactly.
        const head = Styler.truncate(raw, width);
        const tail = raw.substring(head.length); // Use head.length (string length) to slice
        
        // If we want word wrapping, we would check if 'head' ends with space or if 'tail' starts with space.
        // But implementing proper word wrap with visual width is complex without iterating.
        
        return {
            head: head,
            tail: tail // No trimStart() to preserve structure if needed, or maybe yes.
        };
    }

    focus() {
        this.isFocused = true;
        this.render(); // Re-render to show focus indicator (border color change?)
    }

    blur() {
        this.isFocused = false;
        this.render();
    }

    handleKey(key: readline.Key): boolean {
        if (!this.options.scrollable) return false;

        const { height, padding } = this.options;
        const pad = padding || 1;
        const innerHeight = (height || 0) - 2 - (pad * 2);
        const maxScroll = Math.max(0, this.processedLines.length - innerHeight);

        let consumed = false;

        if (key.name === 'up') {
            if (this.scrollTop > 0) {
                this.scrollTop--;
                consumed = true;
            }
        } else if (key.name === 'down') {
            if (this.scrollTop < maxScroll) {
                this.scrollTop++;
                consumed = true;
            }
        } else if (key.name === 'pageup') {
            this.scrollTop = Math.max(0, this.scrollTop - innerHeight);
            consumed = true;
        } else if (key.name === 'pagedown') {
             this.scrollTop = Math.min(maxScroll, this.scrollTop + innerHeight);
             consumed = true;
        }

        if (consumed) {
            this.render();
            return true;
        }
        return false;
    }

    render() {
        const { x, y, width, height, padding, title, style: borderStyle, borderColor, scrollable } = this.options;
        const style = BORDERS[borderStyle || 'round'];
        // Use bright color if focused
        const color = this.isFocused ? 'brightCyan' : (borderColor || 'white');
        
        const startX = x || 1;
        const startY = y || 1;
        const pad = padding || 1;
        
        const innerWidth = (width || 0) - 2;
        const innerHeight = (height || 0) - 2;
        const contentHeight = innerHeight - (pad * 2);

        // 1. Draw Top Border
        let topBorder = style.tl + style.h.repeat(innerWidth) + style.tr;
        if (title) {
            const titleStr = ` ${title} `;
            const leftLen = Math.floor((innerWidth - titleStr.length) / 2);
            const rightLen = innerWidth - leftLen - titleStr.length;
            
            if (leftLen >= 0) {
                 topBorder = style.tl + style.h.repeat(leftLen) + Styler.style(titleStr, 'bold') + style.h.repeat(rightLen) + style.tr;
            }
        }
        Screen.write(startX, startY, Styler.style(topBorder, color));

        // 2. Draw Content Body
        for (let i = 0; i < innerHeight; i++) {
            // Check if we are in padding zone or content zone
            // Padding is applied at top and bottom inside the box?
            // Usually padding is around content.
            // Let's assume uniform padding for simplicity in calculation, 
            // but here we iterate lines.
            
            let lineContent = "";
            
            if (i >= pad && i < innerHeight - pad) {
                const contentIndex = (i - pad) + this.scrollTop;
                if (contentIndex < this.processedLines.length) {
                    lineContent = this.processedLines[contentIndex];
                }
            }

            const rawLen = Styler.len(lineContent);
            const contentWidth = innerWidth - (pad * 2);

            // Ensure we don't overflow horizontally even if wrap failed or wasn't on
            if (rawLen > contentWidth) {
                lineContent = Styler.truncate(lineContent, contentWidth);
            }

            const remainingSpace = contentWidth - Styler.len(lineContent);
            const rowString = ' '.repeat(pad) + lineContent + ' '.repeat(Math.max(0, remainingSpace)) + ' '.repeat(pad);
            
            // Trim/Pad to exact innerWidth using visual logic if possible, 
            // but padEnd/substring use string length. 
            // Since we ensured lineContent visual length is correct and we added spaces (width 1),
            // we should be careful.
            
            // Re-calculate visual length of the constructed row
            // We want 'rowString' to have visual width exactly 'innerWidth'
            
            // If we constructed it correctly: 
            // pad (len) + lineContent (len) + remaining (len) + pad (len)
            // = pad + (contentWidth - remaining) + remaining + pad = contentWidth + 2*pad = innerWidth.
            // So visual width should be correct.
            
            // However, padEnd/substring operate on string length.
            // If lineContent has wide chars, string length < visual width.
            // 'safeRowString' logic below was:
            // const safeRowString = rowString.padEnd(innerWidth).substring(0, innerWidth);
            // This is DANGEROUS because it truncates by string index!
            
            // We should trust our construction above.
            const safeRowString = rowString; 

            let rightBorder = style.v;
            // Scrollbar logic
            if (scrollable) {
                const maxScroll = Math.max(0, this.processedLines.length - contentHeight);
                if (maxScroll > 0) {
                     // Calculate scrollbar position
                     const scrollbarHeight = Math.max(1, Math.floor((contentHeight / this.processedLines.length) * contentHeight));
                     const scrollPercent = this.scrollTop / maxScroll;
                     const scrollPos = Math.floor(scrollPercent * (contentHeight - scrollbarHeight));
                     
                     // Are we in the scrollbar zone? (i is relative to inner box, 0 to innerHeight-1)
                     // But content area is from pad to innerHeight-pad
                     if (i >= pad && i < innerHeight - pad) {
                         const contentRow = i - pad;
                         if (contentRow >= scrollPos && contentRow < scrollPos + scrollbarHeight) {
                             rightBorder = '│'; // Active scrollbar part, maybe color it differently
                             // Actually user suggested using unicode or color change
                             // Let's make it a colored block or pipe
                             rightBorder = Styler.style('│', 'brightWhite');
                         } else {
                             rightBorder = Styler.style('│', 'dim'); // Track
                         }
                     }
                }
            }

            const row = `${style.v}${safeRowString}${rightBorder}`;
            Screen.write(startX, startY + 1 + i, Styler.style(row, color));
        }

        // 3. Draw Bottom Border
        Screen.write(startX, startY + (height || 0) - 1, Styler.style(style.bl + style.h.repeat(innerWidth) + style.br, color));
    }

    // Static compatibility method
    static render(content: string | string[], options: BoxOptions = {}) {
        const box = new Box(content, options);
        box.render();
    }
}