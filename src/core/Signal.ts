import { Screen } from './Screen';

export type Accessor<T> = () => T;
export type Setter<T> = (value: T | ((prev: T) => T)) => void;

/**
 * Creates a reactive signal.
 * When the value updates, it automatically schedules a screen render.
 * @param initialValue The initial value of the signal.
 */
export function createSignal<T>(initialValue: T): [Accessor<T>, Setter<T>] {
    let value = initialValue;

    const read: Accessor<T> = () => value;
    
    const write: Setter<T> = (newValue) => {
        const nextValue = newValue instanceof Function ? (newValue as (prev: T) => T)(value) : newValue;
        
        if (value !== nextValue) {
            value = nextValue;
            Screen.scheduleRender();
        }
    };

    return [read, write];
}

/**
 * Creates a memoized value that caches its result and only re-calculates 
 * when the result of the function changes (polled during access).
 * 
 * Note: A true dependency graph is out of scope. This implementation 
 * re-runs the function on every access but could store the last result 
 * if we had a way to know if dependencies changed. 
 * 
 * Since we don't track dependencies, we can't safely cache unless we know inputs didn't change.
 * BUT, often `createMemo` is used to avoid expensive calcs if called multiple times in one render pass.
 * 
 * For now, this is a simple pass-through.
 */
export function createMemo<T>(fn: () => T): Accessor<T> {
    // Without a dependency graph (tracking which signals are read inside fn),
    // we cannot safely memoize across time because we don't know when to invalidate.
    // We would need a global "context stack" like SolidJS/React.
    // For this architectural step, we provide the API surface.
    return () => fn();
}
