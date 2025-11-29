import { Screen, FocusManager, Box, Table, Textarea, Select, Checkbox, RadioGroup, InputField, Input } from '../src';

async function main() {
    Screen.enter();

    const fm = new FocusManager();

    // 2. Form Area
    const nameInput = new InputField({
        id: 'name',
        label: 'Name',
        x: 2, y: 5,
        width: 30
    });

    const countrySelect = new Select({
        id: 'country',
        label: 'Country',
        x: 40, y: 5,
        items: ["USA", "Vietnam", "Japan", "Germany", "France"],
        width: 20
    });

    const termsCheck = new Checkbox({
        id: 'terms',
        label: 'I agree to terms',
        x: 2, y: 8,
        checked: false
    });

    const genderRadio = new RadioGroup({
        id: 'gender',
        label: 'Gender',
        x: 40, y: 8,
        items: ["Male", "Female", "Other"],
        direction: 'horizontal'
    });

    const bioText = new Textarea({
        id: 'bio',
        label: 'Bio',
        x: 2, y: 11,
        width: 60,
        height: 6,
        value: "Write something about yourself...\nThis supports multi-line text.\nAnd scrolling!"
    });

    const dataTable = new Table(["ID", "Name", "Role"], {
        id: 'users',
        x: 2, y: 18,
        height: 8,
        scrollable: true
    });
    for(let i=1; i<=20; i++) {
        dataTable.addRow([i.toString(), `User ${i}`, i%2===0 ? "Admin" : "User"]);
    }

    // Register all
    fm.register(nameInput);
    fm.register(countrySelect);
    fm.register(termsCheck);
    fm.register(genderRadio);
    fm.register(bioText);
    fm.register(dataTable);

    // Render Function
    const render = () => {
        // Header
        Box.render("ADVANCED COMPONENT DEMO", {
            x: 1, y: 1, width: 80, height: 3, style: 'double', borderColor: 'brightMagenta', title: 'Voonex'
        });
        
        // Components
        nameInput.render();
        countrySelect.render();
        termsCheck.render();
        genderRadio.render();
        bioText.render();
        dataTable.render();

        Screen.write(2, 28, "Tab: Next | Shift+Tab: Prev | Ctrl+C: Exit");
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
