import { Styler, ColorName } from '../core/Styler';
import { Screen } from '../core/Screen';

export interface BoxOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    padding?: number;
    borderColor?: ColorName;
    title?: string;
    style?: 'single' | 'double' | 'round';
    fill?: boolean; // New: Defaults to true usually
}

const BORDERS = {
    single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
    double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
    round:  { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' }
};

export class Box {
    static render(content: string | string[], options: BoxOptions = {}) {
        const lines = Array.isArray(content) ? content : content.split('\n');
        const pad = options.padding || 1;
        const style = BORDERS[options.style || 'round'];
        const color = options.borderColor || 'white';
        const startX = options.x || 1;
        const startY = options.y || 1;

        // Auto-calculate width if not provided
        const contentMaxWidth = Math.max(...lines.map(l => Styler.len(l)));
        const boxWidth = options.width || (contentMaxWidth + (pad * 2) + 2);
        const innerWidth = boxWidth - 2;

        // Auto-calculate height if not provided
        const boxHeight = options.height || (lines.length + (pad * 2) + 2);
        const innerHeight = boxHeight - 2;

        // 1. Draw Top Border
        let topBorder = style.tl + style.h.repeat(innerWidth) + style.tr;
        if (options.title) {
            const titleStr = ` ${options.title} `;
            const leftLen = Math.floor((innerWidth - titleStr.length) / 2);
            const rightLen = innerWidth - leftLen - titleStr.length;
            
            if (leftLen >= 0) {
                 topBorder = style.tl + style.h.repeat(leftLen) + Styler.style(titleStr, 'bold') + style.h.repeat(rightLen) + style.tr;
            }
        }
        Screen.write(startX, startY, Styler.style(topBorder, color));

        // 2. Draw Content Body (With FILL logic)
        for (let i = 0; i < innerHeight; i++) {
            const contentIndex = i - pad;
            let lineContent = "";

            if (contentIndex >= 0 && contentIndex < lines.length) {
                lineContent = lines[contentIndex];
            }

            const rawLen = Styler.len(lineContent);
            const remainingSpace = innerWidth - rawLen - pad;
            
            // CRITICAL FIX: Construct a full string of length 'innerWidth'
            // Padding Left + Content + Padding Right
            // We use spaces to overwrite anything underneath (Opaque effect)
            const rowString = ' '.repeat(pad) + lineContent + ' '.repeat(Math.max(0, remainingSpace));
            
            // Trim or pad slightly if math is off by 1 char due to odd/even widths
            const safeRowString = rowString.padEnd(innerWidth).substring(0, innerWidth);

            const row = `${style.v}${safeRowString}${style.v}`;
            Screen.write(startX, startY + 1 + i, Styler.style(row, color));
        }

        // 3. Draw Bottom Border
        Screen.write(startX, startY + boxHeight - 1, Styler.style(style.bl + style.h.repeat(innerWidth) + style.br, color));
    }
}