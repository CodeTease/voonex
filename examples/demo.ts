import * as readline from 'readline';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(prompt: string): Promise<string> {
    return new Promise(resolve => rl.question(prompt, ans => resolve(ans.trim())));
}

async function main() {
    const defaultFile = process.argv[2] ?? path.resolve(process.cwd(), 'examples', 'demo.ts');

    console.log("Example files are in ./examples/, EX: movement.ts → ./examples/movement.ts");
    let fileInput = await question(`Enter filename to test [${defaultFile}]: `);
    if (!fileInput) fileInput = defaultFile;

    if (!path.isAbsolute(fileInput) && path.dirname(fileInput) === '.') {
        fileInput = path.join('examples', fileInput);
    }

    const filePath = path.isAbsolute(fileInput) ? fileInput : path.resolve(process.cwd(), fileInput);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        rl.close();
        process.exit(1);
    }

    if (path.extname(filePath) !== '.ts') {
        const ans = (await question(`The file does not have a .ts extension. Continue? (y/N): `)).toLowerCase();
        if (ans !== 'y' && ans !== 'yes') {
            console.log('Aborted.');
            rl.close();
            process.exit(0);
        }
    }

    const confirm = (await question(`About to run: npx ts-node "${filePath}". Proceed? (y/N): `)).toLowerCase();
    if (confirm !== 'y' && confirm !== 'yes') {
        console.log('Aborted.');
        rl.close();
        process.exit(0);
    }

    rl.close();

    const child = spawn('npx', ['ts-node', filePath], { stdio: 'inherit', shell: true });

    child.on('exit', code => {
        if (code === 0) {
            console.log(`Process finished successfully (exit ${code}).`);
        } else {
            console.error(`Process exited with code ${code}.`);
        }
        process.exit(code ?? 0);
    });

    child.on('error', err => {
        console.error('Failed to start process:', err);
        process.exit(1);
    });
}

main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});