import { Screen, Button, Box, Input, Styler, Popup } from '../src';

// 1. Enter Screen (Registers signal handlers automatically)
Screen.enter();

// 2. State
let clickCount = 0;

// 3. Components
const btnClick = new Button({
    id: 'btn-click',
    text: "Click Me!",
    x: 5, y: 10,
    style: 'brackets',
    onPress: () => {
        clickCount++;
        Screen.scheduleRender();
    }
});

const btnExit = new Button({
    id: 'btn-exit',
    text: "Exit",
    x: 25, y: 10,
    style: 'simple',
    onPress: () => {
        // Safe exit
        Screen.leave();
        process.exit(0);
    }
});

// 4. Render Function
function render() {
    Box.render([
        "Mouse Support Demo",
        "",
        "1. Click the buttons below.",
        "2. Try scrolling (events logged).",
        "",
        `Button Clicked: ${clickCount} times`
    ], {
        x: 2, y: 2,
        width: 40,
        height: 8,
        title: "Instructions",
        borderColor: 'cyan'
    });

    btnClick.render();
    btnExit.render();
    
    Screen.write(5, 12, Styler.style("Also check console for raw mouse events (if redirected)", 'dim'));
}

// 5. Mount
Screen.mount(render);

// 6. Manual Mouse Listener (Optional, for debugging)
Input.onMouse((event) => {
    // We can verify mouse tracking is on
    // Screen.write(50, 2, `Mouse: ${event.x}, ${event.y} ${event.action} ${event.button}`);
});

// 7. Keyboard Escape
Input.onKey(key => {
    if (key.name === 'q') {
        // Safe exit
        Screen.leave();
        process.exit(0);
    }
    // Ctrl+C is handled globally by Screen/Input or standard signals now
});
