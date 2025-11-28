import { Screen, Input, Box, InputField, Styler } from '../src';

// ==============================
// 1. SETUP UI ELEMENTS
// ==============================

const inputs: InputField[] = [
    new InputField({ 
        label: "Username", 
        x: 30, y: 10, 
        width: 30, 
        focused: true 
    }),
    new InputField({ 
        label: "Password", 
        x: 30, y: 13, 
        width: 30, 
        type: 'password'
    })
];

let focusedIndex = 0;
let message = "";

// ==============================
// 2. RENDER LOOP
// ==============================

function render() {
    // Draw Main Container Box (Static)
    Box.render([], {
        title: "VOONEX LOGIN SYSTEM",
        x: 25, y: 7,
        width: 50,
        height: 14,
        borderColor: 'brightBlue',
        style: 'double'
    });

    // Draw Help Text
    Screen.write(28, 18, Styler.style("[TAB] Switch Focus   [ENTER] Submit   [ESC] Quit", 'dim'));

    // Draw Inputs
    inputs.forEach(inp => inp.render());

    // Draw Button Simulation
    const btnColor = focusedIndex === 2 ? 'bgGreen' : 'bgBlack';
    const btnText = Styler.style("   LOGIN   ", btnColor, 'bold', focusedIndex === 2 ? 'white' : 'green');
    Screen.write(45, 16, btnText);

    // Draw Status Message
    Screen.write(30, 20, Styler.style(message.padEnd(40), 'yellow'));
}

// ==============================
// 3. LOGIC & EVENT HANDLING
// ==============================

async function start() {
    Screen.enter();
    render();

    Input.onKey((key) => {
        // Global Exit
        if (key.name === 'escape') {
            Screen.leave();
            process.exit(0);
        }

        // Navigation (TAB / DOWN)
        if (key.name === 'tab' || key.name === 'down') {
            // FIX: Check existence before assignment instead of using ?.
            if (focusedIndex < inputs.length) {
                inputs[focusedIndex].focused = false;
            }
            
            focusedIndex = (focusedIndex + 1) % 3; // 0, 1, 2(Button)
            
            if (focusedIndex < inputs.length) {
                inputs[focusedIndex].focused = true;
            }
            render();
            return;
        }

        // Navigation (UP)
        if (key.name === 'up') {
            if (focusedIndex < inputs.length) {
                inputs[focusedIndex].focused = false;
            }
            
            focusedIndex = (focusedIndex - 1 + 3) % 3;
            
            if (focusedIndex < inputs.length) {
                inputs[focusedIndex].focused = true;
            }
            render();
            return;
        }

        // Submit Action
        if (key.name === 'return' || key.name === 'enter') {
            if (focusedIndex === 2) { // Button
                const user = inputs[0].value;
                const pass = inputs[1].value;
                
                message = "Authenticating...";
                render();

                setTimeout(() => {
                    if (user === 'admin' && pass === '1234') {
                        message = "SUCCESS! Welcome Admin.";
                        render();
                        setTimeout(() => {
                            Screen.leave();
                            console.log(Styler.style("\nLogged in successfully.", 'green'));
                            process.exit(0);
                        }, 1000);
                    } else {
                        message = "ERROR: Invalid Credentials!";
                        inputs[1].setValue(""); // Clear pass
                        render();
                    }
                }, 800);
            } else {
                // If on input, move to next
                if (focusedIndex < inputs.length) inputs[focusedIndex].focused = false;
                focusedIndex = (focusedIndex + 1) % 3;
                if (focusedIndex < inputs.length) inputs[focusedIndex].focused = true;
                render();
            }
            return;
        }

        // Typing
        if (focusedIndex < inputs.length) {
            inputs[focusedIndex].handleKey(key.name || '', key.sequence);
            render();
        }
    });
}

start();