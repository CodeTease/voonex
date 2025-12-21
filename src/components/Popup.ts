import { Box } from './Box';
import { Screen, Layer } from '../core/Screen';
import { Styler } from '../core/Styler';
import { ColorName } from '../core/Styler';
import { Input } from '../core/Input';

export class Popup {
    static alert(message: string, options: { title?: string, color?: ColorName } = {}) {
        // Mount a high-priority render function
        const renderPopup = () => {
             const { width, height } = Screen.size;
             const lines = message.split('\n');
             const maxLen = Math.max(...lines.map(l => Styler.len(l)));
             
             const boxWidth = Math.max(maxLen + 6, 40);
             const boxHeight = lines.length + 4; 
             
             const x = Math.floor((width - boxWidth) / 2);
             const y = Math.floor((height - boxHeight) / 2);

             // Manually clear popup area for opacity
             for(let i=0; i<boxHeight; i++) {
                 Screen.write(x, y + i, " ".repeat(boxWidth));
             }

             Box.render([
                 ...lines
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
        };

        Screen.mount(renderPopup, Layer.MODAL);
        
        const handler = (key: any) => {
            if (key.name === 'return' || key.name === 'enter' || key.name === 'escape') {
                Screen.unmount(renderPopup);
                Input.offKey(handler);
                return true; // Stop propagation
            }
            return true; // Consume other keys while popup is open? 
            // Usually alerts are modal, so yes, consume everything.
        };
        
        Input.onKey(handler);
    }
}
