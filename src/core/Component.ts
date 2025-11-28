// ==========================================
// CORE: COMPONENT LIFECYCLE
// ==========================================

export interface ComponentLifecycle {
    init?(): void;
    destroy?(): void;
    onMount?(): void;
    onUnmount?(): void;
}
