import { Screen, Menu, ProgressBar, Box, Input, Styler, Cursor } from '../src';

async function main() {
    Screen.enter();
    
    // Draw a Header
    Box.render([
        "VOONEX WIDGETS DEMO",
        "Select an action below"
    ], { 
        padding: 1, 
        borderColor: 'brightMagenta', 
        style: 'double' 
    });

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
            handleSelection(item);
        }
    });

    menu.start();
}

function handleSelection(action: string) {
    // Clear the menu area (rough clearing for demo)
    for(let i=0; i<15; i++) {
        Screen.write(2, 8 + i, " ".repeat(40));
    }

    if (action === "Exit") {
        Screen.leave();
        process.exit(0);
    }

    Screen.write(4, 10, Styler.style(`Executing: ${action}...`, 'yellow'));
    
    // Simulate Progress Bar
    const bar = new ProgressBar({
        width: 30,
        total: 100,
        format: "Processing: [:bar] :percent | :status",
        completeChar: '█',
        incompleteChar: '░'
    });

    let progress = 0;
    // Move cursor to a specific spot for the bar
    // Note: ProgressBar currently writes to stdout directly via \r, 
    // for a TUI we usually want it at specific X,Y. 
    // This is a hybrid demo.
    Cursor.moveTo(4, 12);

    const timer = setInterval(() => {
        progress += 2;
        // Hacky cursor positioning for the bar loop in this simple architecture
        Cursor.moveTo(4, 12);
        
        bar.update(progress, { 
            status: progress < 50 ? "Initializing" : "Finalizing" 
        });

        if (progress >= 100) {
            clearInterval(timer);
            bar.finish();
            
            Screen.write(4, 14, Styler.style("DONE! Press any key to exit.", 'green', 'bold'));
            
            // Wait for key to exit
            Input.reset(); // Reset previous listeners
            Input.onKey(() => {
                Screen.leave();
                process.exit(0);
            });
        }
    }, 50);
}

main();