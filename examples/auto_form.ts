import { Screen, Box, InputField, Button, FocusManager, Input, Styler, Popup } from '../src';

async function main() {
    Screen.enter();

    // 1. Setup UI Static Elements
    Box.render([], {
        title: "AUTOMATED FORM",
        x: 20, y: 5,
        width: 60,
        height: 18,
        borderColor: 'brightYellow',
        style: 'double'
    });

    Screen.write(22, 18, Styler.style("Use [TAB] or [ARROWS] to navigate. [ENTER] to act.", 'dim'));

    // 2. Setup Focus Manager
    const focusManager = new FocusManager();

    // 3. Create Components
    const firstName = new InputField({ id: 'fname', label: "First Name", x: 25, y: 8, width: 30 });
    const lastName = new InputField({ id: 'lname', label: "Last Name ", x: 25, y: 11, width: 30 });
    const email = new InputField({ id: 'email', label: "Email Addr", x: 25, y: 14, width: 30 });

    const btnSubmit = new Button({
        id: 'btn-submit',
        text: "SUBMIT DATA",
        x: 25, y: 19,
        width: 15,
        onPress: () => {
            handleSubmit();
        }
    });

    const btnCancel = new Button({
        id: 'btn-cancel',
        text: "CANCEL",
        x: 45, y: 19,
        width: 10,
        onPress: () => {
            Screen.leave();
            process.exit(0);
        }
    });

    // 4. Register Components to Manager (Order matters for Tab cycle!)
    focusManager.register(firstName);
    focusManager.register(lastName);
    focusManager.register(email);
    focusManager.register(btnSubmit);
    focusManager.register(btnCancel);

    // 5. Initial Render
    // We render manually once, then updates happen via interactions
    firstName.render();
    lastName.render();
    email.render();
    btnSubmit.render();
    btnCancel.render();

    // 6. Hook into Input
    Input.onKey((key) => {
        // Global Exit safety
        if (key.name === 'escape') {
            Screen.leave();
            process.exit(0);
        }
        
        // Delegate EVERYTHING to the Manager
        focusManager.handleKey(key);
    });

    function handleSubmit() {
        // Validation Logic
        if (!email.value.includes('@')) {
            Popup.alert("Invalid Email Address!", { title: "ERROR", color: "red" });
            // Hack: Re-render inputs after popup clears (in a real app, layer manager handles this)
            setTimeout(() => {
                 // In this simple architecture, we might need to manually refresh UI
                 // For now, let's just log or assume user presses a key to refresh
                 firstName.render(); lastName.render(); email.render();
            }, 100); 
            return;
        }

        Popup.alert(`Saved: ${firstName.value} ${lastName.value}`, { title: "SUCCESS", color: "green" });
        // Clear form
        firstName.setValue("");
        lastName.setValue("");
        email.setValue("");
        firstName.render(); lastName.render(); email.render();
    }
}

main();