// ==========================================
// CORE: LAYOUT ENGINE (The "Architect")
// ==========================================

import { Rect } from './Screen';

export { Rect };

export class Layout {
    /**
     * Splits a rectangle vertically (into columns).
     * @param parent The parent rectangle
     * @param weights Array of weights (e.g. [1, 2] means 1/3 and 2/3) or absolute sizes
     */
    static splitVertical(parent: Rect, weights: number[]): Rect[] {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let currentX = parent.x;
        
        return weights.map((w, i) => {
            // Check if it's the last item to fill remaining space (avoid rounding errors)
            const isLast = i === weights.length - 1;
            const width = isLast 
                ? parent.width - (currentX - parent.x)
                : Math.floor((w / totalWeight) * parent.width);
            
            const rect = {
                x: currentX,
                y: parent.y,
                width: width,
                height: parent.height
            };
            currentX += width;
            return rect;
        });
    }

    /**
     * Splits a rectangle horizontally (into rows).
     */
    static splitHorizontal(parent: Rect, weights: number[]): Rect[] {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let currentY = parent.y;

        return weights.map((w, i) => {
            const isLast = i === weights.length - 1;
            const height = isLast
                ? parent.height - (currentY - parent.y)
                : Math.floor((w / totalWeight) * parent.height);

            const rect = {
                x: parent.x,
                y: currentY,
                width: parent.width,
                height: height
            };
            currentY += height;
            return rect;
        });
    }

    /**
     * Creates a padded inner rectangle.
     */
    static pad(rect: Rect, padding: number): Rect {
        return {
            x: rect.x + padding,
            y: rect.y + padding,
            width: Math.max(0, rect.width - (padding * 2)),
            height: Math.max(0, rect.height - (padding * 2))
        };
    }
}
