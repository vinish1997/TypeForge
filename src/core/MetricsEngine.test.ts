import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsEngine } from './MetricsEngine';

describe('MetricsEngine', () => {
    let engine: MetricsEngine;

    beforeEach(() => {
        engine = new MetricsEngine();
    });

    it('should compute exact Gross and Net WPM with 100% accuracy over 1 minute', () => {
        engine.start(0);

        // 100 correct keystrokes = 20 words
        for (let i = 0; i < 100; i++) {
            engine.recordKeystroke(true, false);
        }

        // Finalize at 60,000ms (1.0 minute)
        const metrics = engine.finalize(60000);

        expect(metrics.totalKeystrokes).toBe(100);
        expect(metrics.correctKeystrokes).toBe(100);
        expect(metrics.errorCount).toBe(0);
        expect(metrics.accuracy).toBe(100);
        expect(metrics.grossWpm).toBe(20.0);
        expect(metrics.netWpm).toBe(20.0);
        expect(metrics.elapsedTimeMs).toBe(60000);
    });

    it('should penalize Net WPM for uncorrected errors', () => {
        engine.start(0);

        // 90 correct characters (= 18 words)
        for (let i = 0; i < 90; i++) {
            engine.recordKeystroke(true, false);
        }
        // 10 incorrect characters (10 uncorrected errors)
        for (let i = 0; i < 10; i++) {
            engine.recordKeystroke(false, false);
        }

        // Over 1 minute: Net WPM = (18 words - 10 errors) / 1 min = 8 WPM
        const metrics = engine.finalize(60000);

        expect(metrics.totalKeystrokes).toBe(100);
        expect(metrics.correctKeystrokes).toBe(90);
        expect(metrics.errorCount).toBe(10);
        expect(metrics.uncorrectedErrors).toBe(10);
        expect(metrics.accuracy).toBe(90.0);
        expect(metrics.grossWpm).toBe(20.0);
        expect(metrics.netWpm).toBe(8.0);
    });

    it('should decrement uncorrected errors when backspace erases an error', () => {
        engine.start(0);

        // Typist makes a mistake
        engine.recordKeystroke(false, false);
        expect(engine.finalize(1000).uncorrectedErrors).toBe(1);

        // Typist hits Backspace and fixes the error
        engine.recordBackspace(true);

        const metrics = engine.finalize(2000);
        expect(metrics.uncorrectedErrors).toBe(0);
        expect(metrics.backspaceCount).toBe(1);
        expect(metrics.totalKeystrokes).toBe(2); // 1 key + 1 backspace
    });

    it('should subtract paused durations from active elapsed time', () => {
        engine.start(0);

        // Typist types for 5s
        engine.recordKeystroke(true, false);

        // Pauses at 10,000ms for 20,000ms (resumes at 30,000ms)
        engine.pause(10000);
        engine.resume(30000);

        // Finalizes at 90,000ms total wall-clock time
        // Active time should be 90,000 - 20,000 (paused) = 70,000ms
        const metrics = engine.finalize(90000);
        expect(metrics.elapsedTimeMs).toBe(70000);
    });

    it('should credit auto-indentation spaces toward output progress', () => {
        engine.start(0);

        // 4 spaces of auto-indentation
        for (let i = 0; i < 4; i++) {
            engine.recordKeystroke(true, true);
        }

        const metrics = engine.finalize(60000);
        expect(metrics.correctKeystrokes).toBe(4);
        expect(metrics.totalKeystrokes).toBe(4);
        expect(metrics.accuracy).toBe(100);
    });

    it('should suppress live WPM during the 3-second warm-up window', () => {
        // Mock performance.now
        const originalNow = performance.now;
        let mockTime = 1000;
        performance.now = () => mockTime;

        engine.start(1000);

        // At 2 seconds in (2,000ms active): should be null
        mockTime = 3000;
        expect(engine.getLiveUpdate().liveWpm).toBeNull();

        // At 3 seconds in (3,000ms active): should still be null
        mockTime = 4000;
        expect(engine.getLiveUpdate().liveWpm).toBeNull();

        // At 4 seconds in (4,000ms active): should emit computed number
        mockTime = 5000;
        for (let i = 0; i < 20; i++) {
            engine.recordKeystroke(true, false);
        }
        expect(typeof engine.getLiveUpdate().liveWpm).toBe('number');

        performance.now = originalNow;
    });
});
