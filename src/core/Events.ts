// ==========================================
// CORE: EVENT MANAGER
// ==========================================

export type EventHandler = (data?: any) => void;

export class EventManager {
    private static instance: EventManager;
    private listeners: Map<string, EventHandler[]> = new Map();

    private constructor() {}

    static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    on(event: string, handler: EventHandler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(handler);
    }

    off(event: string, handler: EventHandler) {
        if (!this.listeners.has(event)) return;
        const handlers = this.listeners.get(event)!;
        this.listeners.set(event, handlers.filter(h => h !== handler));
    }

    emit(event: string, data?: any) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event)!.forEach(handler => handler(data));
    }
}

// Global accessor
export const Events = EventManager.getInstance();
