import { Box } from '../src/components/Box';
import { Screen } from '../src/core/Screen';
import { Input } from '../src/core/Input';
import { FocusManager } from '../src/core/Focus';

async function main() {
    Screen.enter();

    const longText = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        "",
        "--- Section 2 ---",
        "This is a test of the scrolling functionality.",
        "The box should handle text wrapping automatically if the line is too long.",
        "You should be able to scroll up and down using Arrow keys.",
        "Focus is indicated by a brighter border.",
        "",
        "Lines to fill space:",
        "1. Line one",
        "2. Line two",
        "3. Line three",
        "4. Line four",
        "5. Line five",
        "6. Line six",
        "7. Line seven",
        "8. Line eight",
        "9. Line nine",
        "10. Line ten",
        "End of text."
    ];

    const box1 = new Box(longText, {
        id: 'box1',
        title: 'Scrollable Box 1',
        x: 2,
        y: 2,
        width: 40,
        height: 10,
        scrollable: true,
        wrap: true,
        borderColor: 'cyan'
    });

    const box2 = new Box(longText, {
        id: 'box2',
        title: 'Scrollable Box 2',
        x: 45,
        y: 2,
        width: 30,
        height: 15,
        scrollable: true,
        wrap: true,
        borderColor: 'magenta'
    });

    const fm = new FocusManager();
    fm.register(box1);
    fm.register(box2);

    // Render Function
    const render = () => {
        box1.render();
        box2.render();
        Screen.write(2, 20, "Press TAB to switch focus. Arrows/PgUp/PgDn to scroll. Ctrl+C to exit.");
    };

    Screen.mount(render);

    Input.onKey((key) => {
        fm.handleKey(key);
        // FocusManager calls .focus()/.blur() on components, which might call render() internally?
        // Box.focus() calls this.render().
        // If Box.render() calls Screen.write(), it schedules render.
        // And since we mounted 'render', when flush happens, it calls 'render' again.
        // This is fine. 'render' calls 'box1.render()', which writes.
        // It's efficient enough.
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
