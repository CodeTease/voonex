// ==========================================
// CORE: COMPONENT LIFECYCLE
// ==========================================

import { Screen, Layer } from './Screen';

export interface ComponentLifecycle {
    init?(): void;
    destroy?(): void;
    onMount?(): void;
    onUnmount?(): void;
}

export abstract class Component implements ComponentLifecycle {
    private mounted: boolean = false;
    private boundRender: () => void;

    constructor() {
        this.boundRender = this.render.bind(this);
        this.init?.();
    }

    /**
     * Called when the component is instantiated.
     */
    init?(): void;

    /**
     * Called before the component is destroyed.
     */
    destroy?(): void;

    /**
     * Called when the component is mounted to the screen.
     */
    onMount?(): void;

    /**
     * Called when the component is unmounted from the screen.
     */
    onUnmount?(): void;

    /**
     * The render function that draws the component to the screen.
     */
    abstract render(): void;

    /**
     * Mounts the component to the Screen rendering loop.
     * @param zIndex Layer priority (default: Layer.CONTENT)
     */
    mount(zIndex: number = Layer.CONTENT) {
        if (this.mounted) return;
        this.mounted = true;
        Screen.mount(this.boundRender, zIndex);
        this.onMount?.();
    }

    /**
     * Unmounts the component from the Screen rendering loop.
     */
    unmount() {
        if (!this.mounted) return;
        this.mounted = false;
        Screen.unmount(this.boundRender);
        this.onUnmount?.();
    }
}
