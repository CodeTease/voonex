import { Styler, ColorName } from '../core/Styler';
import { Screen } from '../core/Screen';

interface ProgressBarOptions {
    width?: number;
    total?: number;
    completeChar?: string;
    incompleteChar?: string;
    format?: string; // ":bar :percent :msg"
    color?: ColorName; 
    x?: number; // Optional X position
    y?: number; // Optional Y position
}

export class ProgressBar {
    private current = 0;
    private total: number;
    private width: number;
    private chars: { complete: string; incomplete: string };
    private format: string;
    private color: ColorName;
    private x: number;
    private y: number;

    constructor(options: ProgressBarOptions = {}) {
        this.total = options.total || 100;
        this.width = options.width || 40;
        this.chars = {
            complete: options.completeChar || '█',
            incomplete: options.incompleteChar || '░'
        };
        this.format = options.format || "[:bar] :percent";
        this.color = options.color || 'green';
        this.x = options.x || 0;
        this.y = options.y || 0;
    }

    // Allow overriding position in update
    update(current: number, tokens: Record<string, string> = {}, pos?: { x: number, y: number }) {
        this.current = current;
        // Use provided pos or stored pos
        const drawX = pos?.x ?? this.x;
        const drawY = pos?.y ?? this.y;

        const ratio = Math.min(Math.max(current / this.total, 0), 1);
        const percent = Math.floor(ratio * 100);
        
        const completeLen = Math.round(this.width * ratio);
        const incompleteLen = this.width - completeLen;

        const bar = 
            Styler.style(this.chars.complete.repeat(completeLen), this.color) + 
            Styler.style(this.chars.incomplete.repeat(incompleteLen), 'dim');

        let str = this.format
            .replace(':bar', bar)
            .replace(':percent', Styler.style(`${percent}%`.padStart(4), 'bold'));

        // Replace custom tokens (e.g., :msg)
        for (const [key, val] of Object.entries(tokens)) {
            str = str.replace(`:${key}`, val);
        }

        // Use Screen.write instead of direct stdout
        Screen.write(drawX, drawY, str);
    }

    finish() {
        // No-op in buffered mode, or maybe clear? 
        // Or keep last state.
    }
}