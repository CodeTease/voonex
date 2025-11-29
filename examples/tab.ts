import { Screen, FocusManager, Box, TabManager, Events, Input } from '../src';

async function main() {
    Screen.enter();

    const fm = new FocusManager();

    // Tab Manager
    const tabManager = new TabManager({
        id: 'main-tabs',
        x: 2, y: 5,
        width: 78,
        height: 20,
        titles: ["Dashboard", "Logs", "Settings"],
        onTabChange: (index) => {
            Events.emit('tab:change', index);
            // We need to re-render when tab changes.
            // Screen.scheduleRender will be called if TabManager calls render/write internally?
            // TabManager usually handles keys and updates its state.
            // If we use Screen.mount, we just rely on state.
        }
    });

    fm.register(tabManager);

    // Current Tab State
    let currentTabIndex = 0;
    
    // Listen to event to update state
    Events.on('tab:change', (index: number) => {
        currentTabIndex = index;
        Screen.scheduleRender();
    });

    // Render Function
    const render = () => {
        // 1. Header
        Box.render("TAB & EVENT DEMO", {
            x: 1, y: 1, width: 80, height: 3, style: 'double', borderColor: 'brightMagenta', title: 'Voonex'
        });
        
        // 2. Tab Manager
        tabManager.render();
        
        // 3. Content Area Logic
        // Clear area first (handled by Painter's Algo if we mount this)
        
        let content = "";
        const index = currentTabIndex;
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
        
        Screen.write(2, 23, "Use Left/Right Arrows to switch tabs. Tab key to navigate focus (if more components). Ctrl+C to exit.");
    };

    Screen.mount(render);

    Input.onKey((key) => {
        fm.handleKey(key);
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
