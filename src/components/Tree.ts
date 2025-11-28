import { Styler } from '../core/Styler';

export interface TreeNode {
    name: string;
    children?: TreeNode[];
    info?: string;
}

export class Tree {
    static render(node: TreeNode, prefix = '', isLast = true) {
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