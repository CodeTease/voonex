// ==========================================
// CORE: LAYOUT ENGINE (The "Architect")
// ==========================================

import { Rect } from './Screen';

export { Rect };

export interface LayoutOptions {
    direction: 'row' | 'column';
    gap?: number;
    children: LayoutItem[];
}

export interface LayoutItem {
    weight?: number; // Flex-grow equivalent
    fixed?: number;  // Fixed size (width or height depending on direction)
    id?: string;     // Optional ID for identifying the resulting rect
}

export interface LayoutResult {
    rects: Rect[];
    map: Map<string, Rect>; // Map ID -> Rect for easy access
}

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

    /**
     * Advanced Layout Calculator (Flexbox-like)
     */
    static compute(parent: Rect, options: LayoutOptions): LayoutResult {
        const { direction, gap = 0, children } = options;
        const count = children.length;
        if (count === 0) return { rects: [], map: new Map() };

        const totalGap = gap * (count - 1);
        const availableSpace = (direction === 'row' ? parent.width : parent.height) - totalGap;
        
        // 1. Calculate Fixed Sizes
        let usedSpace = 0;
        let totalWeight = 0;
        
        children.forEach(child => {
            if (child.fixed !== undefined) {
                usedSpace += child.fixed;
            } else {
                totalWeight += (child.weight || 1);
            }
        });

        const remainingSpace = Math.max(0, availableSpace - usedSpace);
        const unitSpace = totalWeight > 0 ? remainingSpace / totalWeight : 0;

        // 2. Compute Rects
        const rects: Rect[] = [];
        const map = new Map<string, Rect>();
        
        let currentPos = direction === 'row' ? parent.x : parent.y;

        children.forEach((child, i) => {
            let size = 0;
            if (child.fixed !== undefined) {
                size = child.fixed;
            } else {
                size = Math.floor((child.weight || 1) * unitSpace);
                // Last dynamic item gets rounding dust? 
                // We should be careful about accumulating errors.
                // But for now simple floor is okay, maybe we can improve later.
            }
            
            // Adjust for last item to fill gap if we used flooring?
            // Actually, let's keep it simple.

            const rect: Rect = {
                x: direction === 'row' ? currentPos : parent.x,
                y: direction === 'column' ? currentPos : parent.y,
                width: direction === 'row' ? size : parent.width,
                height: direction === 'column' ? size : parent.height
            };
            
            rects.push(rect);
            if (child.id) map.set(child.id, rect);
            
            currentPos += size + gap;
        });

        return { rects, map };
    }
}
