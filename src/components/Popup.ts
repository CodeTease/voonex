import { Box } from './Box';
import { Screen } from '../core/Screen';
import { Styler } from '../core/Styler';
import { ColorName } from '../core/Styler';

export class Popup {
    static alert(message: string, options: { title?: string, color?: ColorName } = {}) {
        const { width, height } = Screen.size;
        const msgLen = Styler.len(message);
        
        const boxWidth = Math.max(msgLen + 6, 40); // Make it slightly wider for better look
        const boxHeight = 5; 
        
        const x = Math.floor((width - boxWidth) / 2);
        const y = Math.floor((height - boxHeight) / 2);

        // No need to manually clear anymore! The new Box renders solid spaces.

        Box.render([
            "", 
            Styler.style(message, 'white', 'bold') 
        ], {
            x, y,
            width: boxWidth,
            height: boxHeight,
            title: options.title || "ALERT",
            borderColor: options.color || 'red',
            style: 'double',
            padding: 1
        });
        
        Screen.write(x + 2, y + boxHeight - 1, Styler.style("[Press Enter]", 'dim'));
    }
}