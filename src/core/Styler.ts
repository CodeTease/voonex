// ==========================================
// CORE: ANSI & STYLING
// ==========================================

const ESC = '\x1b[';
const RESET = `${ESC}0m`;

export const COLORS = {
    // Foreground
    black: 30, red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, cyan: 36, white: 37,
    gray: 90, brightRed: 91, brightGreen: 92, brightYellow: 93, brightBlue: 94, brightMagenta: 95, brightCyan: 96, brightWhite: 97,
    // Background
    bgBlack: 40, bgRed: 41, bgGreen: 42, bgYellow: 43, bgBlue: 44, bgMagenta: 45, bgCyan: 46, bgWhite: 47
} as const;

export const MODIFIERS = {
    bold: 1, dim: 2, italic: 3, underline: 4, inverse: 7, hidden: 8, strikethrough: 9
} as const;

export type ColorName = keyof typeof COLORS;
export type ModifierName = keyof typeof MODIFIERS;

export class Styler {
    /**
     * Applies ANSI styles to a string.
     */
    static style(text: string, ...styles: (ColorName | ModifierName)[]): string {
        const codes = styles.map(s => {
            if (s in COLORS) return COLORS[s as ColorName];
            if (s in MODIFIERS) return MODIFIERS[s as ModifierName];
            return '';
        }).filter(Boolean).join(';');
        
        return `${ESC}${codes}m${text}${RESET}`;
    }

    /**
     * Removes ANSI codes to calculate real string length.
     */
    static strip(text: string): string {
        return text.replace(/\x1b\[[0-9;]*m/g, '');
    }

    /**
     * Checks if a character code point is 'wide' (takes 2 columns).
     * Simplified lookup for CJK and Emoji.
     */
    private static isWide(code: number): boolean {
        if (!code) return false;
        return (code >= 0x1100 && (
            (code <= 0x115f) ||  // Hangul Jamo
            (code === 0x2329) || // Left-pointing Angle Bracket
            (code === 0x232a) || // Right-pointing Angle Bracket
            (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) || // CJK ... Yi
            (code >= 0xac00 && code <= 0xd7a3) || // Hangul Syllables
            (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility Ideographs
            (code >= 0xfe10 && code <= 0xfe19) || // Vertical forms
            (code >= 0xfe30 && code <= 0xfe6f) || // CJK Compatibility Forms
            (code >= 0xff00 && code <= 0xff60) || // Fullwidth Forms
            (code >= 0xffe0 && code <= 0xffe6) ||
            (code >= 0x1f300 && code <= 0x1f64f) || // Misc Symbols and Pictographs
            (code >= 0x1f900 && code <= 0x1f9ff)    // Supplemental Symbols and Pictographs
        ));
    }

    /**
     * Returns the visual length of the string (ignoring ANSI codes).
     * Handles CJK and Emojis as 2 columns.
     */
    static len(text: string): number {
        const stripped = this.strip(text);
        let len = 0;
        for (const char of stripped) {
            len += this.isWide(char.codePointAt(0)!) ? 2 : 1;
        }
        return len;
    }

    /**
     * Truncates a string to fit within a visual width.
     * Returns the substring.
     */
    static truncate(text: string, maxWidth: number): string {
        const { result } = this.truncateWithState(text, maxWidth);
        return result;
    }

    /**
     * Advanced truncation that preserves ANSI state.
     * Returns the truncated string and the active ANSI style at the cut point.
     */
    static truncateWithState(text: string, maxWidth: number): { result: string, remaining: string, endStyle: string } {
        let width = 0;
        let result = "";
        let currentStyle = ""; // Tracks active style
        let remaining = "";
        
        const parts = text.split(/(\x1b\[[0-9;]*m)/);
        let finished = false;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            
            if (finished) {
                remaining += part;
                continue;
            }

            if (part.startsWith('\x1b[')) {
                result += part;
                // Track style state
                if (part === '\x1b[0m' || part === '\x1b[m') {
                    currentStyle = "";
                } else {
                    // This is a naive stack approximation. 
                    // Real ANSI handling might be more complex (accumulating vs replacing).
                    // But usually in TUI we just append.
                    currentStyle += part;
                }
            } else {
                for (let j = 0; j < part.length; j++) {
                    // Iterate by code point to handle surrogate pairs correctly?
                    // JS strings are UTF-16. 'char' loop iterates code units.
                    // But we need code points for isWide.
                    // For simplicity, let's assume iterator handles surrogate pairs if we use `for...of` on string?
                    // Actually `for (const char of part)` iterates code points (unicode) in ES6.
                    // But we need index `j` to match `part`.
                    // We can't mix index loop and iterator easily.
                    // Let's use iterator and rebuild buffer.
                    
                    // But wait, the outer loop IS an iterator.
                    // Previous implementation used `for (const char of part)`.
                    // Let's stick to that but we need to know when we stop to build `remaining`.
                    
                    // Actually, let's restart the inner loop logic to be safer.
                    break; 
                }
                
                // Better approach for inner text
                let partIndex = 0;
                for (const char of part) {
                    const charWidth = this.isWide(char.codePointAt(0)!) ? 2 : 1;
                    
                    if (width + charWidth > maxWidth) {
                        // We hit the limit.
                        // We need to stop here.
                        // `remaining` starts from here.
                        // `part` is the current text chunk.
                        remaining += part.substring(partIndex); // Rest of this part
                        finished = true;
                        break; 
                    }
                    
                    width += charWidth;
                    result += char;
                    partIndex += char.length; // char.length might be 2 for emojis
                }
            }
        }
        
        // If we finished with an active style, we should probably RESET it in result?
        // Or leave it open? Screen.write handles it per cell.
        // But if we print `result` then newline, the style might leak?
        // Generally `truncate` returns the string to be printed.
        // Ideally we append RESET to result if style is active, and PREPEND style to remaining.
        
        return {
            result: result + (currentStyle ? '\x1b[0m' : ''),
            remaining: (currentStyle ? currentStyle : '') + remaining,
            endStyle: currentStyle
        };
    }
}
