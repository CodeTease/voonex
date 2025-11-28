import { Screen, Layout, Box, Table, Styler, Input, Popup } from '../src';

// Global State
let isPopupOpen = false;

// ==============================
// 1. RENDER FUNCTION
// ==============================
function renderDashboard() {
    // Critical: Always clear screen on re-render for clean resizing
    // But inside a static loop (like typing), we might not want full clear.
    // For Dashboard resizing, we usually want a full clear or robust overwrite.
    // Since our Box component is opaque, we just need to ensure we don't leave
    // "trash" at the edges if screen grew then shrank.
    // Screen.onResize handles the clear(), so here we just draw.

    const fullScreen = { x: 0, y: 0, width: process.stdout.columns, height: process.stdout.rows };

    // 2. Layout Logic (Recalculate based on NEW size)
    // Dynamic Layout: Weights change based on height? 
    // Let's keep it simple: Header 3 rows, Body rest.
    const [headerArea, bodyArea] = Layout.splitHorizontal(fullScreen, [3, 20]);
    
    // Sidebar 20%, Main 80%
    const [sidebarArea, mainArea] = Layout.splitVertical(bodyArea, [1, 4]);
    
    // Content 2/3, Logs 1/3
    const [contentArea, logsArea] = Layout.splitHorizontal(mainArea, [2, 1]);

    // === RENDER HEADER ===
    Box.render([
        "VOONEX DASHBOARD v0.1.0",
        `Width: ${fullScreen.width} | Height: ${fullScreen.height}`
    ], {
        ...headerArea,
        title: "SYSTEM",
        borderColor: 'cyan',
        style: 'round'
    });

    // === RENDER SIDEBAR ===
    Box.render([
        "❯ Dashboard",
        "  Analytics",
        "  Settings",
        "  Logout"
    ], {
        ...sidebarArea,
        title: "MENU",
        borderColor: 'blue'
    });

    // === RENDER MAIN CONTENT ===
    Box.render([], {
        ...contentArea,
        title: "LIVE MONITORING",
        borderColor: 'white'
    });
    
    // Table needs to fit inside contentArea
    // Check if we have enough space to render table
    if (contentArea.height > 5 && contentArea.width > 20) {
        const tableArea = Layout.pad(contentArea, 1);
        const table = new Table(["ID", "Service", "Status", "Latency"], { 
            x: tableArea.x, 
            y: tableArea.y 
        });
        
        table.addRow(["S01", "Auth Service", Styler.style("Active", "green"), "12ms"]);
        table.addRow(["S02", "Payment GW", Styler.style("Degraded", "yellow"), "150ms"]);
        table.addRow(["S03", "Notification", Styler.style("Active", "green"), "45ms"]);
        
        table.render();
    } else {
        Screen.write(contentArea.x + 2, contentArea.y + 2, Styler.style("Window too small!", 'red'));
    }

    // === RENDER LOGS ===
    Box.render([
        Styler.style("[INFO] Resized at " + new Date().toLocaleTimeString(), 'dim'),
        Styler.style("[WARN] High latency detected on S02", 'yellow'),
    ], {
        ...logsArea,
        title: "SYSTEM LOGS",
        borderColor: 'gray'
    });

    // Footer Help
    // Ensure footer is always at bottom
    Screen.write(2, process.stdout.rows - 1, Styler.style("Press 'p' for Popup, 'q' to Quit", 'dim'));

    // Re-render popup if it was open
    if (isPopupOpen) {
        Popup.alert("This is a Voonex Popup!\nStill here after resize.", { 
            title: "NOTIFICATION", 
            color: "brightMagenta" 
        });
    }
}

// ==============================
// 2. MAIN LOOP
// ==============================
async function main() {
    Screen.enter();
    
    // Initial Render
    renderDashboard();

    // REGISTER RESIZE HANDLER
    // This makes the app responsive!
    Screen.onResize(() => {
        renderDashboard();
    });

    // Event Listener attached ONCE
    Input.onKey((key) => {
        if (isPopupOpen) {
            if (key.name === 'return' || key.name === 'enter' || key.name === 'escape') {
                isPopupOpen = false;
                renderDashboard(); 
            }
            return;
        }

        if (key.name === 'q') {
            Screen.leave();
            process.exit(0);
        }
        
        if (key.name === 'p') {
            isPopupOpen = true;
            renderDashboard(); // Re-render to show popup
        }
        
        if (key.name === 'r') {
            renderDashboard();
        }
    });
}

main();