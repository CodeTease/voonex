import { Screen, Box, InputField, Button, FocusManager, Input, Styler, Popup } from '../src';

async function main() {
    Screen.enter();

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

    // 4. Register Components
    focusManager.register(firstName);
    focusManager.register(lastName);
    focusManager.register(email);
    focusManager.register(btnSubmit);
    focusManager.register(btnCancel);

    // 5. Render Function
    const render = () => {
        // Static Elements
        Box.render([], {
            title: "AUTOMATED FORM",
            x: 20, y: 5,
            width: 60,
            height: 18,
            borderColor: 'brightYellow',
            style: 'double'
        });

        Screen.write(22, 18, Styler.style("Use [TAB] or [ARROWS] to navigate. [ENTER] to act.", 'dim'));

        // Components
        firstName.render();
        lastName.render();
        email.render();
        btnSubmit.render();
        btnCancel.render();
    };

    Screen.mount(render);

    // 6. Hook into Input
    Input.onKey((key) => {
        if (key.name === 'escape') {
            Screen.leave();
            process.exit(0);
        }
        
        focusManager.handleKey(key);
    });

    function handleSubmit() {
        // Validation Logic
        if (!email.value.includes('@')) {
            Popup.alert("Invalid Email Address!", { title: "ERROR", color: "red" });
            return;
        }

        Popup.alert(`Saved: ${firstName.value} ${lastName.value}`, { title: "SUCCESS", color: "green" });
        
        // Clear form
        firstName.setValue("");
        lastName.setValue("");
        email.setValue("");
        // No manual render needed, Input loop handles it.
        Screen.scheduleRender();
    }
}

main();
