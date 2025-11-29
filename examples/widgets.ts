import { Screen, Menu, ProgressBar, Box, Input, Styler, Cursor } from '../src';

async function main() {
    Screen.enter();
    
    // State
    let menuActive = true;
    let processing = false;
    let progress = 0;
    let status = "";
    let done = false;

    // Initialize Menu
    const menu = new Menu({
        title: "DEPLOYMENT OPTIONS",
        items: [
            "Deploy to Production",
            "Run Tests",
            "Update Dependencies",
            "Exit"
        ],
        x: 4,
        y: 8,
        onSelect: (index, item) => {
            if (item === "Exit") {
                Screen.leave();
                process.exit(0);
            }
            
            // Start Processing
            menuActive = false;
            processing = true;
            status = "Initializing";
            Screen.scheduleRender(); // Trigger render change
            
            // Start Animation Loop
            const timer = setInterval(() => {
                progress += 2;
                status = progress < 50 ? "Initializing" : "Finalizing";
                
                if (progress >= 100) {
                    clearInterval(timer);
                    processing = false;
                    done = true;
                }
                Screen.scheduleRender(); // Trigger render update
            }, 50);
        }
    });
    
    // Hack to enable menu input processing without calling start()
    // We treat it as "focused" manually
    (menu as any).active = true; 

    const bar = new ProgressBar({
        width: 30,
        total: 100,
        format: "Processing: [:bar] :percent | :status",
        completeChar: '█',
        incompleteChar: '░',
        x: 4,
        y: 12
    });

    // Render Function
    const render = () => {
        // Draw a Header
        Box.render([
            "VOONEX WIDGETS DEMO",
            "Select an action below"
        ], { 
            padding: 1, 
            borderColor: 'brightMagenta', 
            style: 'double' 
        });

        if (menuActive) {
            menu.render(); // Draws menu
        } else if (processing) {
             Screen.write(4, 10, Styler.style(`Executing...`, 'yellow'));
             
             // ProgressBar updates usually draw.
             // We want to force draw.
             // ProgressBar.update(val, tokens) updates state AND draws.
             // But we are in render() which is called repeatedly.
             // We should call bar.render() here, but ProgressBar might not expose it publicly or cleanly separate it from update logic?
             // If we check ProgressBar.ts later...
             // For now, let's call bar.update() with current values, which re-draws.
             bar.update(progress, { status: status });
             
        } else if (done) {
             Screen.write(4, 10, Styler.style(`Executing...`, 'yellow'));
             bar.update(100, { status: "Done" });
             Screen.write(4, 14, Styler.style("DONE! Press any key to exit.", 'green', 'bold'));
        }
    };
    
    Screen.mount(render);

    Input.onKey((key) => {
        if (done) {
            Screen.leave();
            process.exit(0);
        }
        
        if (menuActive) {
            menu.handleKey(key);
        }
    });
}

main();
