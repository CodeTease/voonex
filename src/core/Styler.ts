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
     * Returns the visual length of the string (ignoring ANSI codes).
     */
    static len(text: string): number {
        return this.strip(text).length;
    }
}