import { EventMap, IEventBus } from '../types';

export class EventBus implements IEventBus {
    private listeners: Map<keyof EventMap, Set<(payload: any) => void>> = new Map();

    on<K extends keyof EventMap>(event: K, handler:
        (payload: EventMap[K]) => void): () => void {

        // 1. Get existing Set or create a new one
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        const handlers = this.listeners.get(event)!;
        handlers.add(handler as (payload: any) => void);

        // 2. Return the unsubscribe function
        return () => {
            handlers.delete(handler as (payload: any) => void);
        };
    }

    emit<K extends keyof EventMap>(event: K, payload:
        EventMap[K]): void {
        const handlers = this.listeners.get(event);
        if (!handlers || handlers.size === 0) {
            return;
        }
        // Iterate over handlers; wrap each call in try/catch to isolate failures
        [...handlers].forEach((handler) => {
            try {
                handler(payload);
            } catch (error) {
                console.error(`[EventBus] Unhandled error in listener for "${String(event)}":`, error);
            }
        });
    }
}