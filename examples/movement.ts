import { Screen, Input, Box, Styler } from '../src';

// Game State
let x = 5;
let y = 3;
const speed = 2;
let running = true;

function render() {
    // 1. Clear previous frame (Simple clear for now)
    Screen.enter(); // Ensure we are in alt buffer
    // Note: In a real advanced engine, we would diff and only clear needed parts.
    // For now, we clear the specific area or whole screen.
    // To avoid flickering in this simple version, we won't clear *everything*, just overwrite.
}

function update() {
    // Clear screen manually to prevent trails (naive approach for Phase 1)
    console.clear(); 
    
    // Draw Instructions
    Screen.write(2, 1, Styler.style("VOONEX INTERACTIVE DEMO", 'bold', 'cyan'));
    Screen.write(2, 2, "Use Arrow Keys to move. Press 'q' to quit.");

    // Draw the Player (Box)
    // We hack the Box component to render at specific lines by capturing its output
    // But since Box uses console.log directly, we can't easily position it yet without refactoring Box.
    // So for Phase 1 demo, we draw manually using Screen.write
    
    const playerColor = 'brightGreen';
    Screen.write(x, y,     Styler.style("╔════════╗", playerColor));
    Screen.write(x, y + 1, Styler.style("║ VOONEX ║", playerColor, 'bold'));
    Screen.write(x, y + 2, Styler.style("╚════════╝", playerColor));

    // Draw coordinates
    Screen.write(2, process.stdout.rows - 2, Styler.style(`Pos: ${x}, ${y}`, 'dim'));
}

async function start() {
    Screen.enter();

    Input.onKey((key) => {
        switch (key.name) {
            case 'up':
                y = Math.max(0, y - 1);
                break;
            case 'down':
                y = Math.min(process.stdout.rows - 3, y + 1);
                break;
            case 'left':
                x = Math.max(0, x - speed);
                break;
            case 'right':
                x = Math.min(process.stdout.columns - 10, x + speed);
                break;
            case 'q':
                running = false;
                cleanup();
                process.exit(0);
                break;
        }
        // Re-render on input (Event-driven rendering)
        update(); 
    });

    // Initial render
    update();
}

function cleanup() {
    Screen.leave();
    Input.reset();
}

// Handle unexpected exits
process.on('exit', cleanup);

start();