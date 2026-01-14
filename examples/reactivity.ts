import { Screen } from '../src/core/Screen';
import { Component } from '../src/core/Component';
import { createSignal, createMemo } from '../src/core/Signal';
import { Input } from '../src/core/Input';
import { Styler } from '../src/core/Styler';

class CounterApp extends Component {
    // Reactive State
    private count = createSignal(0);
    private isRunning = createSignal(true);
    
    // Derived State (Memo)
    private doubleCount = createMemo(() => this.count[0]() * 2);

    constructor() {
        super();
        
        // Auto-increment counter
        const interval = setInterval(() => {
            if (this.isRunning[0]()) {
                // Functional update: set(prev => prev + 1)
                this.count[1](c => c + 1);
            }
        }, 100); // Fast updates!

        // Stop after 5 seconds
        setTimeout(() => {
            clearInterval(interval);
            this.isRunning[1](false);
            
            // Clean exit
            setTimeout(() => {
                process.exit(0);
            }, 1000);
        }, 5000);
    }

    render() {
        // Just by reading the signals, we display the current state.
        // We don't need to call render() manually in the interval above!
        
        const c = this.count[0]();
        const d = this.doubleCount();
        const running = this.isRunning[0]();

        Screen.write(2, 2, Styler.style(" REACTIVE SIGNAL DEMO ", 'bgMagenta', 'bold', 'white'));
        
        Screen.write(2, 4, `Count: ${c}  `); 
        Screen.write(2, 5, `Double: ${d}  `);
        Screen.write(2, 7, `Status: ${running ? Styler.style('RUNNING', 'green') : Styler.style('STOPPED', 'red')}  `);
        
        Screen.write(2, 9, Styler.style("Updates automatically without manual render calls!", 'dim'));
    }
}

// Main Entry
Screen.enter();

const app = new CounterApp();
app.mount();

// Input handling to exit early
Input.onKey((key) => {
    if (key.name === 'escape') {
        Screen.leave();
        process.exit(0);
        return true;
    }
});

// Initial Render (Auto-triggered by mount, but good practice to ensure buffer is ready)
// Screen.scheduleRender(); // Not even needed! Mount does it.
