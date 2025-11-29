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
        // We cannot strip ANSI here because we want to return the string WITH ANSI, just truncated content.
        // But properly truncating with ANSI is hard (need to maintain state).
        // For this task, let's assume we operate on the content or 'Box' handles ANSI separately?
        // Box passes 'currentLine' which might have ANSI?
        // Box.ts says: "Note: This is a simple char split. Ideally split by words. But Styler.len handles ansi codes, so slicing directly is dangerous if codes exist."
        // The current implementation in Box assumes plain text or stripped text for wrapping logic in `wrapLine`.
        // Let's stick to operating on the raw string, but being careful.
        
        // If we want to support ANSI, we need to iterate the string token by token.
        // Given 'zero-dependency' and current state, let's implement a robust version that handles ANSI.
        
        let width = 0;
        let result = "";
        
        const parts = text.split(/(\x1b\[[0-9;]*m)/);
        
        for (const part of parts) {
            if (part.startsWith('\x1b[')) {
                result += part; // Keep ANSI codes
            } else {
                for (const char of part) {
                    const charWidth = this.isWide(char.codePointAt(0)!) ? 2 : 1;
                    if (width + charWidth > maxWidth) {
                        return result;
                    }
                    width += charWidth;
                    result += char;
                }
            }
        }
        
        return result;
    }
}
