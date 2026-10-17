import { describe, it, expect, vi } from 'vitest';
import { EventBus } from './EventBus';

describe('EventBus', () => {
    it('should deliver event payloads to subscribed listeners', () => {
        const bus = new EventBus();
        const handler = vi.fn();

        bus.on('SESSION_STARTED', handler);
        bus.emit('SESSION_STARTED', { startTime: 1000, snippetId: 'snip-1' });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith({ startTime: 1000, snippetId: 'snip-1' });
    });

    it('should deliver events to multiple subscribers', () => {
        const bus = new EventBus();
        const handlerA = vi.fn();
        const handlerB = vi.fn();

        bus.on('LINE_ADVANCED', handlerA);
        bus.on('LINE_ADVANCED', handlerB);
        bus.emit('LINE_ADVANCED', { fromLine: 1, toLine: 2, skippedIndentChars: 4 });

        expect(handlerA).toHaveBeenCalledTimes(1);
        expect(handlerB).toHaveBeenCalledTimes(1);
    });

    it('should stop delivering events after unsubscribing', () => {
        const bus = new EventBus();
        const handler = vi.fn();

        const unsubscribe = bus.on('SESSION_PAUSED', handler);
        bus.emit('SESSION_PAUSED', { pausedAt: 5000 });
        expect(handler).toHaveBeenCalledTimes(1);

        unsubscribe();
        bus.emit('SESSION_PAUSED', { pausedAt: 6000 });
        expect(handler).toHaveBeenCalledTimes(1); // Should still be 1!
    });

    it('should prevent duplicate registration of the same handler reference', () => {
        const bus = new EventBus();
        const handler = vi.fn();

        bus.on('SESSION_RESET', handler);
        bus.on('SESSION_RESET', handler); // Same reference registered twice
        bus.emit('SESSION_RESET', { snippetId: 'snip-1' });

        expect(handler).toHaveBeenCalledTimes(1); // Set prevents double-execution!
    });

    it('should isolate errors so one failing listener does not break others', () => {
        const bus = new EventBus();
        const faultyHandler = vi.fn(() => {
            throw new Error('Simulated subscriber crash');
        });
        const healthyHandler = vi.fn();

        // Silence console.error during this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        bus.on('KEYSTROKE_PROCESSED', faultyHandler);
        bus.on('KEYSTROKE_PROCESSED', healthyHandler);

        expect(() => {
            bus.emit('KEYSTROKE_PROCESSED', {
                index: 0,
                char: 'd',
                isCorrect: true,
                isIndent: false,
            });
        }).not.toThrow();

        expect(faultyHandler).toHaveBeenCalledTimes(1);
        expect(healthyHandler).toHaveBeenCalledTimes(1); // Healthy handler still ran!

        consoleSpy.mockRestore();
    });
});
