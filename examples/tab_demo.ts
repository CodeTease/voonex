import { Screen, FocusManager, Box, TabManager, Events, Input } from '../src';

async function main() {
    Screen.enter();

    // 1. Header
    Box.render("TAB & EVENT DEMO", {
        x: 1, y: 1, width: 80, height: 3, style: 'double', borderColor: 'brightMagenta', title: 'Voonex'
    });

    const fm = new FocusManager();

    // 2. Tab Manager
    const tabManager = new TabManager({
        id: 'main-tabs',
        x: 2, y: 5,
        width: 78,
        height: 20,
        titles: ["Dashboard", "Logs", "Settings"],
        onTabChange: (index) => {
            Events.emit('tab:change', index);
        }
    });

    fm.register(tabManager);

    // Initial Render of Tabs
    tabManager.render();

    // 3. Content Area Logic using Events
    // We don't really need a persistent box instance if we re-render static boxes
    
    const renderContent = (index: number) => {
        // Clear area first (naive clear)
        for(let i=0; i<15; i++) Screen.write(2, 7+i, ' '.repeat(78));

        let content = "";
        if (index === 0) {
            content = "DASHBOARD VIEW\n\n- Stats: OK\n- Uptime: 99%\n- Users: 50";
        } else if (index === 1) {
            content = "SYSTEM LOGS\n\n[INFO] System started\n[WARN] Low memory\n[ERR] Connection reset";
        } else {
            content = "SETTINGS\n\n[ ] Enable Feature A\n[x] Enable Feature B";
        }

        Box.render(content.split('\n'), {
            x: 2, y: 7, width: 78, height: 15, borderColor: 'white', title: `Tab ${index + 1}`
        });
    };

    Events.on('tab:change', (index: number) => {
        renderContent(index);
    });

    // Initial content
    renderContent(0);

    Screen.write(2, 23, "Use Left/Right Arrows to switch tabs. Tab key to navigate focus (if more components). Ctrl+C to exit.");

    Input.onKey((key) => {
        fm.handleKey(key);
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
