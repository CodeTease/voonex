import { Styler } from '../core/Styler';
import { Focusable } from '../core/Focus';
import { Screen } from '../core/Screen';
import * as readline from 'readline';

export interface TreeNode {
    name: string;
    children?: TreeNode[];
    info?: string;
    expanded?: boolean; // New state
}

export interface TreeOptions {
    id: string;
    root: TreeNode;
    x: number;
    y: number;
    height?: number; // For scrolling
}

// Flattened node for navigation
interface FlatNode {
    node: TreeNode;
    depth: number;
    parent?: TreeNode;
}

export class Tree implements Focusable {
    public id: string;
    private root: TreeNode;
    private options: TreeOptions;
    private isFocused: boolean = false;
    private flatList: FlatNode[] = [];
    private selectedIndex: number = 0;
    private scrollTop: number = 0;

    constructor(options: TreeOptions) {
        this.id = options.id;
        this.options = options;
        this.root = options.root;
        // Ensure root is expanded by default?
        this.root.expanded = true;
        this.recalculateFlatList();
    }

    private recalculateFlatList() {
        this.flatList = [];
        const traverse = (node: TreeNode, depth: number, parent?: TreeNode) => {
            this.flatList.push({ node, depth, parent });
            if (node.children && node.expanded) {
                node.children.forEach(child => traverse(child, depth + 1, node));
            }
        };
        traverse(this.root, 0);
    }

    focus() {
        this.isFocused = true;
        this.render();
    }

    blur() {
        this.isFocused = false;
        this.render();
    }

    handleKey(key: readline.Key): boolean {
        if (!this.isFocused) return false;

        let consumed = false;
        
        if (key.name === 'up') {
            if (this.selectedIndex > 0) {
                this.selectedIndex--;
                this.ensureVisible();
                consumed = true;
            }
        } else if (key.name === 'down') {
            if (this.selectedIndex < this.flatList.length - 1) {
                this.selectedIndex++;
                this.ensureVisible();
                consumed = true;
            }
        } else if (key.name === 'right') {
            const current = this.flatList[this.selectedIndex];
            if (current.node.children) {
                if (!current.node.expanded) {
                    current.node.expanded = true;
                    this.recalculateFlatList();
                    consumed = true;
                }
            }
        } else if (key.name === 'left') {
            const current = this.flatList[this.selectedIndex];
            if (current.node.children && current.node.expanded) {
                current.node.expanded = false;
                this.recalculateFlatList();
                consumed = true;
            } else if (current.parent) {
                // Move selection to parent
                const parentIdx = this.flatList.findIndex(x => x.node === current.parent);
                if (parentIdx !== -1) {
                    this.selectedIndex = parentIdx;
                    this.ensureVisible();
                    consumed = true;
                }
            }
        } else if (key.name === 'enter') {
            // Toggle expansion
            const current = this.flatList[this.selectedIndex];
             if (current.node.children) {
                 current.node.expanded = !current.node.expanded;
                 this.recalculateFlatList();
                 consumed = true;
             }
        }

        if (consumed) this.render();
        return consumed;
    }

    private ensureVisible() {
        if (!this.options.height) return;
        const visibleHeight = this.options.height;
        
        if (this.selectedIndex < this.scrollTop) {
            this.scrollTop = this.selectedIndex;
        } else if (this.selectedIndex >= this.scrollTop + visibleHeight) {
            this.scrollTop = this.selectedIndex - visibleHeight + 1;
        }
    }

    render() {
        const { x, y, height } = this.options;
        const visibleHeight = height || this.flatList.length;

        // Clear area if possible? Or rely on overwrite.
        // Assuming box drawing or clearing happens before or we write spaces.
        
        for (let i = 0; i < visibleHeight; i++) {
            const idx = i + this.scrollTop;
            if (idx < this.flatList.length) {
                const { node, depth } = this.flatList[idx];
                const isSelected = idx === this.selectedIndex;
                
                const indent = '  '.repeat(depth);
                const icon = node.children ? (node.expanded ? '📂' : '📁') : '📄';
                const prefix = isSelected ? (this.isFocused ? '❯ ' : '> ') : '  ';
                
                let name = node.name;
                if (isSelected && this.isFocused) {
                    name = Styler.style(name, 'cyan', 'bold');
                } else if (isSelected) {
                    name = Styler.style(name, 'white', 'bold');
                } else {
                    name = Styler.style(name, 'dim');
                }

                Screen.write(x, y + i, `${prefix}${indent}${icon} ${name}`.padEnd(50)); // Pad to clear prev text
            } else {
                Screen.write(x, y + i, ' '.repeat(50));
            }
        }
    }
    
    // Compatibility Static Render (prints to console directly, not Screen.write at xy)
    static render(node: TreeNode, prefix = '', isLast = true) {
         // This is for CLI usage (console.log)
        const connector = isLast ? '└── ' : '├── ';
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        
        const icon = node.children ? '📁' : '📄';
        const info = node.info ? Styler.style(` (${node.info})`, 'dim') : '';
        const name = node.children ? Styler.style(node.name, 'brightCyan', 'bold') : node.name;

        console.log(`${Styler.style(prefix + connector, 'dim')}${icon} ${name}${info}`);

        if (node.children) {
            const children = node.children;
            children.forEach((child, index) => {
                Tree.render(child, childPrefix, index === children.length - 1);
            });
        }
    }
}