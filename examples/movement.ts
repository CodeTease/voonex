import { Screen, Input, Box, Styler } from '../src';

// Game State
let x = 5;
let y = 3;
const speed = 2;
let running = true;

function render() {
    // With Painter's Algorithm, we don't need to manually clear.
    // Screen.flush handles clearing if roots are present.
    
    // Draw Instructions
    Screen.write(2, 1, Styler.style("VOONEX INTERACTIVE DEMO", 'bold', 'cyan'));
    Screen.write(2, 2, "Use Arrow Keys to move. Press 'q' to quit.");

    // Draw the Player (Box)
    const playerColor = 'brightGreen';
    Screen.write(x, y,     Styler.style("╔════════╗", playerColor));
    Screen.write(x, y + 1, Styler.style("║ VOONEX ║", playerColor, 'bold'));
    Screen.write(x, y + 2, Styler.style("╚════════╝", playerColor));

    // Draw coordinates
    Screen.write(2, process.stdout.rows - 2, Styler.style(`Pos: ${x}, ${y}`, 'dim'));
}

async function start() {
    Screen.enter();
    
    // Mount render function
    Screen.mount(render);

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
        // State updated, Screen.scheduleRender() is called automatically by Input
    });
}

function cleanup() {
    Screen.leave();
    Input.reset();
}

// Handle unexpected exits
process.on('exit', cleanup);

start();
