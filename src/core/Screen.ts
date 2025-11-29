// ==========================================
// CORE: SCREEN MANAGER (The "Canvas")
// ==========================================

import { Cursor } from './Cursor';

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Cell {
    char: string;
    style: string;
}

export class Screen {
    private static isAlternateBuffer = false;
    private static resizeTimeout: NodeJS.Timeout | null = null;
    
    // Double Buffering
    private static currentBuffer: Cell[][] = [];
    private static previousBuffer: Cell[][] = [];
    private static dirtyRows: boolean[] = [];
    
    // Layer Stack
    // Stores snapshots of the buffer before a new layer is added.
    private static layerStack: Cell[][][] = [];

    // Reactive Rendering
    private static isDirty = false;
    private static renderScheduled = false;

    private static width = 0;
    private static height = 0;

    // Component Registry for Layering (Painter's Algorithm)
    private static renderRoots: Array<{ render: () => void, zIndex: number }> = [];

    /**
     * Enters the Alternate Screen Buffer (like Vim or Nano).
     */
    static enter() {
        if (this.isAlternateBuffer) return;
        process.stdout.write('\x1b[?1049h'); // Enter alternate buffer
        Cursor.hide();
        this.isAlternateBuffer = true;
        
        this.resizeBuffers();
        // Removed startLoop(), now using reactive rendering
        this.onResize(() => {
            this.resizeBuffers();
            this.scheduleRender();
        });
    }

    /**
     * Leaves the Alternate Screen Buffer and restores cursor.
     */
    static leave() {
        if (!this.isAlternateBuffer) return;
        // Removed stopLoop()
        Cursor.show();
        process.stdout.write('\x1b[?1049l'); // Leave alternate buffer
        this.isAlternateBuffer = false;
    }

    private static resizeBuffers() {
        this.width = process.stdout.columns || 80;
        this.height = process.stdout.rows || 24;

        // Initialize or Resize Buffers
        this.currentBuffer = Array(this.height).fill(null).map(() => 
            Array(this.width).fill(null).map(() => ({ char: ' ', style: '' }))
        );
        this.previousBuffer = Array(this.height).fill(null).map(() => 
            Array(this.width).fill(null).map(() => ({ char: ' ', style: '' }))
        );
        // Mark all rows as dirty to ensure full initial render
        this.dirtyRows = Array(this.height).fill(true);
    }

    /**
     * Schedules a render flush in the next tick.
     * Call this whenever a component changes state.
     */
    static scheduleRender() {
        if (this.renderScheduled) return;
        this.renderScheduled = true;
        
        // Use setImmediate to batch updates in the same tick
        setImmediate(() => {
             this.flush();
             this.renderScheduled = false;
        });
    }

    /**
     * Writes text at a specific coordinate into the virtual buffer.
     * Handles ANSI escape codes using a state machine parser.
     * Supports clipping region and relative positioning.
     */
    static write(x: number, y: number, text: string, clipRect?: Rect) {
        if (!this.isAlternateBuffer) return;

        // Apply Clipping Translation: (Relative -> Absolute)
        let absX = x;
        let absY = y;
        
        if (clipRect) {
            absX += clipRect.x;
            absY += clipRect.y;
        }

        // Apply Clipping Bounds
        const clipX1 = clipRect ? clipRect.x : 0;
        const clipY1 = clipRect ? clipRect.y : 0;
        const clipX2 = clipRect ? clipRect.x + clipRect.width : this.width;
        const clipY2 = clipRect ? clipRect.y + clipRect.height : this.height;

        if (absY < clipY1 || absY >= clipY2 || absY >= this.height) return;

        // Mark row as dirty
        this.dirtyRows[absY] = true;
        this.scheduleRender(); // Trigger render

        let currentX = absX;
        let currentStyle = "";
        
        // ANSI State Machine Parser
        let i = 0;
        const len = text.length;

        while (i < len) {
            const char = text[i];

            if (char === '\x1b') {
                // Potential Escape Sequence
                if (i + 1 < len && text[i+1] === '[') {
                    // ANSI Control Sequence Identifier (CSI)
                    let j = i + 2;
                    let code = "";
                    
                    // Read until 'm' or other terminator
                    while (j < len) {
                        const c = text[j];
                        code += c;
                        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
                            break;
                        }
                        j++;
                    }

                    if (code.endsWith('m')) {
                        // Color/Style Code
                        const fullCode = `\x1b[${code}`;
                        if (fullCode === '\x1b[0m' || fullCode === '\x1b[m') {
                            currentStyle = ""; 
                        } else {
                            currentStyle += fullCode;
                        }
                    }
                    
                    i = j + 1;
                    continue;
                }
            }
            
            // Normal Character
            // Check Clipping Horizontally
            if (currentX >= clipX1 && currentX < clipX2 && currentX < this.width) {
                 this.currentBuffer[absY][currentX] = {
                     char: char,
                     style: currentStyle
                 };
            }
            currentX++;
            i++;
        }
    }

    /**
     * Pushes the current screen state to a stack.
     */
    static pushLayer() {
        const snapshot = this.currentBuffer.map(row => row.map(cell => ({ ...cell })));
        this.layerStack.push(snapshot);
    }

    /**
     * Restores the screen state from the stack.
     */
    static popLayer() {
        const snapshot = this.layerStack.pop();
        if (snapshot) {
            if (snapshot.length === this.height && snapshot[0].length === this.width) {
                 this.currentBuffer = snapshot;
                 this.dirtyRows.fill(true);
                 this.scheduleRender();
            }
        }
    }

    /**
     * Clears the virtual buffer.
     */
    static clear() {
        if (!this.currentBuffer.length) return;
        
        for (let y = 0; y < this.height; y++) {
            this.dirtyRows[y] = true;
            for (let x = 0; x < this.width; x++) {
                this.currentBuffer[y][x] = { char: ' ', style: '' };
            }
        }
        this.scheduleRender();
    }

    /**
     * Registers a root component for the rendering loop (Painter's Algorithm).
     * @param renderFn The function that renders the component
     * @param zIndex Priority (higher draws on top)
     */
    static mount(renderFn: () => void, zIndex: number = 0) {
        this.renderRoots.push({ render: renderFn, zIndex });
        this.renderRoots.sort((a, b) => a.zIndex - b.zIndex);
        this.scheduleRender();
    }

    /**
     * Unregisters a root component from the rendering loop.
     * @param renderFn The function that renders the component
     */
    static unmount(renderFn: () => void) {
        this.renderRoots = this.renderRoots.filter(r => r.render !== renderFn);
        this.scheduleRender();
    }

    /**
     * Diffs currentBuffer vs previousBuffer and writes changes to stdout.
     * Optimized with String Batching and Relative Cursor Moves.
     */
    static flush() {
        // Painter's Algorithm Phase: Re-run all render functions if any exist
        // This clears the buffer and redraws everything from scratch (logically)
        // But to keep performance, we might want to just let them draw over currentBuffer?
        // User asked for: "1. Xóa Buffer ảo. 2. Duyệt qua danh sách...".
        // If we have registered roots, we should follow this.
        if (this.renderRoots.length > 0) {
            // We need to clear currentBuffer effectively?
            // Or maybe just let them overwrite. If transparency is involved, clearing is safer.
            // But clearing everything is expensive if we just diff later. 
            // The Diff algorithm handles the "screen update" optimization. 
            // The "Virtual Buffer" update needs to be correct.
            // If we have layers, and top layer moves, we need to redraw bottom layer to see what's behind.
            // So YES, we must clear currentBuffer (or reset it to background state) and redraw all layers.
            
            // Reset currentBuffer to empty/clean state WITHOUT affecting previousBuffer (screen state)
             for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    this.currentBuffer[y][x] = { char: ' ', style: '' };
                }
                // We don't mark dirtyRows here blindly, we mark them if they CHANGE in the diff phase.
                // Wait, dirtyRows optimization relies on us knowing which rows MIGHT have changed.
                // If we clear everything, we potentially change everything.
                // So we should mark all as dirty? 
                // "Dirty" means "Virtual Buffer Row differs from Previous Buffer Row".
                // Since we are rebuilding Virtual Buffer, we don't know yet.
                // We should just run the diff loop on all rows?
                // Or maybe we can track which rows are touched during render?
            }
            
            // Render all layers
            for (const root of this.renderRoots) {
                root.render();
            }
            
            // Mark all rows as dirty for the Diff phase to check them?
            // Since we rebuilt the buffer, any row could be different from previousBuffer.
            // Optimization: Maybe only rows that were touched? 
            // But 'write' marks dirtyRows.
            // So if we clear buffer (resetting chars), we are effectively writing spaces.
            // If we use 'clear()' method, it marks all dirty.
            // Let's rely on 'write' marking dirtyRows.
            // But we just did manual reset loop above.
            // Let's check:
            // If we reset manual loop, we are changing 'currentBuffer'.
            // Previous buffer holds what is on screen.
            // If we don't mark dirtyRows, flush() skips the row.
            // If screen has text, and we cleared it to spaces, and didn't mark dirty, screen stays text. Bad.
            // So yes, we should mark all dirty if we do a full clear-redraw cycle.
            this.dirtyRows.fill(true);
        }

        if (!this.currentBuffer.length) return;

        let output = "";
        let lastY = -1;
        let lastX = -1;
        let lastStyle = "";

        for (let y = 0; y < this.height; y++) {
            if (!this.dirtyRows[y]) continue;
            this.dirtyRows[y] = false;

            let x = 0;
            while (x < this.width) {
                const cell = this.currentBuffer[y][x];
                const prev = this.previousBuffer[y][x];

                // Check for change
                if (cell.char !== prev.char || cell.style !== prev.style) {
                    // Update Previous Buffer
                    this.previousBuffer[y][x] = { ...cell };

                    // Move Cursor
                    // Relative Move Optimization
                    if (y === lastY && x === lastX + 1) {
                        // Already at correct position
                    } else if (y === lastY && x > lastX && x < lastX + 5) {
                         // Close enough for right move
                         const diff = x - (lastX + 1);
                         if (diff > 0) output += `\x1b[${diff}C`; 
                         // If diff is 0 (next char), we do nothing.
                         // Actually if x = lastX + 2, diff is 1. We need \x1b[1C.
                    } else {
                         // Absolute Move
                         output += `\x1b[${y + 1};${x + 1}H`;
                    }

                    // Update Style
                    if (cell.style !== lastStyle) {
                        output += `\x1b[0m${cell.style}`;
                        lastStyle = cell.style;
                    }

                    // String Batching: Look ahead for same style
                    let batch = cell.char;
                    let nextX = x + 1;
                    
                    while (nextX < this.width) {
                        const nextCell = this.currentBuffer[y][nextX];
                        const nextPrev = this.previousBuffer[y][nextX];
                        
                        // We only batch if the NEXT cell also NEEDS update AND has SAME style
                        // Actually, even if next cell DOES NOT need update, 
                        // if we write over it with same content, it's fine (redundant write but saves cursor move).
                        // BUT, if we write over it, we might overwrite something valid with something else? 
                        // No, currentBuffer is truth.
                        
                        // Strategy: 
                        // 1. Only batch consecutive CHANGED cells?
                        // 2. Or batch consecutive cells regardless, as long as style matches, to avoid cursor jumps?
                        // If we skip a cell (not changed), we have to move cursor.
                        // Moving cursor costs bytes (e.g. \x1b[C is 3 bytes).
                        // Writing a char is 1 byte.
                        // So overwriting valid char is cheaper than skipping 1-2 chars.
                        // But if we skip 10 chars, move is cheaper.
                        
                        // Let's stick to simple logic: Only batch if next cell ALSO needs update OR we just overwrite it anyway to jump gap?
                        // The user asked for "Gộp chuỗi ký tự liên tiếp có cùng style".
                        // If we strictly follow diff, we only write changed cells.
                        // So let's look for consecutive CHANGED cells with same style.
                        
                        if (nextCell.char !== nextPrev.char || nextCell.style !== nextPrev.style) {
                            if (nextCell.style === cell.style) {
                                batch += nextCell.char;
                                
                                // Update previous buffer as we consume
                                this.previousBuffer[y][nextX] = { ...nextCell };
                                nextX++;
                            } else {
                                break; // Style changed
                            }
                        } else {
                            // Next cell is not changed.
                            // Should we continue batching to bridge the gap?
                            // If gap is small (1-2 chars), yes.
                            // But that complicates logic. Let's stop batching.
                            break; 
                        }
                    }

                    output += batch;
                    
                    lastY = y;
                    lastX = x + batch.length - 1; // last written position
                    x = nextX; // Continue loop
                } else {
                    x++;
                }
            }
        }

        if (output.length > 0) {
            // Reset style
            // output += '\x1b[0m'; 
            process.stdout.write(output);
        }
    }

    /**
     * Gets current terminal dimensions.
     */
    static get size() {
        return {
            width: process.stdout.columns || 80,
            height: process.stdout.rows || 24
        };
    }

    /**
     * Listens for resize events.
     */
    static onResize(callback: () => void) {
        process.stdout.on('resize', () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = setTimeout(() => {
                callback();
            }, 100);
        });
    }
}
