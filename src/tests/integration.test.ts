import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import { MetricsEngine } from '../core/MetricsEngine';
import { TypingEngine } from '../core/TypingEngine';
import { SessionMetrics } from '../types';
import { SNIPPETS, getRandomSnippet } from '../data/corpus';

describe('End-to-End Integration Tests', () => {
    it('should complete a flawless session on real Python snippet with 100% accuracy', () => {
        const bus = new EventBus();
        const metric = new MetricsEngine();
        const engine = new TypingEngine(bus, metric);

        const snippet = SNIPPETS.find((s) => s.id === 'py-binary-search')!;
        let completedSummary: SessionMetrics | null = null;
        engine.loadSnippet(snippet);

        const startSpy = vi.fn();

        bus.on('SESSION_STARTED', startSpy);
        bus.on('SESSION_COMPLETED', ({ summary }) => {
            completedSummary = summary;
        });

        const lines = snippet.code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]!;
            const lineObj = snippet.lines?.find((l) => l.lineNumber === i + 1);
            const indentSpaces = lineObj?.indentationLength ?? 0;

            for (let j = indentSpaces; j < line.length; j++) {
                engine.handleKey(line[j]!, false, false);
            }

            if (i < lines.length - 1) {
                engine.handleKey('\n', false, true);
            }
        }

        expect(startSpy).toHaveBeenCalledTimes(1);
        expect(completedSummary).not.toBeNull();
        expect(engine.getState()).toBe('COMPLETED');

        expect(completedSummary).not.toBeNull();
        expect(completedSummary!.netWpm).toBeGreaterThan(0);
        expect(completedSummary!.accuracy).toBe(100);

    });

    it('should handle typo, backspace correction, and penalize accuracy in final summary', () => {
        const bus = new EventBus();
        const metric = new MetricsEngine();
        const engine = new TypingEngine(bus, metric);

        const snippet = SNIPPETS.find((s) => s.id === 'py-binary-search')!;

        let completedSummary: SessionMetrics | null = null;
        engine.loadSnippet(snippet);


        const startSpy = vi.fn();

        bus.on('SESSION_STARTED', startSpy);
        bus.on('SESSION_COMPLETED', ({ summary }) => {
            completedSummary = summary;
        });

        engine.handleKey('z', false, false);
        engine.handleKey('Backspace', true, false);
        const lines = snippet.code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]!;
            const lineObj = snippet.lines?.find((l) => l.lineNumber === i + 1);
            const indentSpaces = lineObj?.indentationLength ?? 0;

            for (let j = indentSpaces; j < line.length; j++) {
                engine.handleKey(line[j]!, false, false);
            }

            if (i < lines.length - 1) {
                engine.handleKey('\n', false, true);
            }
        }

        expect(startSpy).toHaveBeenCalledTimes(1);
        expect(completedSummary).not.toBeNull();
        expect(engine.getState()).toBe('COMPLETED');

        expect(completedSummary).not.toBeNull();
        expect(completedSummary!.netWpm).toBeGreaterThan(0);
        expect(completedSummary!.accuracy).toBeLessThan(100);
        expect(completedSummary!.errorCount).toBe(1);
        expect(completedSummary!.uncorrectedErrors).toBe(0);

    });

    it('should reset to IDLE and clean state when switching snippets mid-session', () => {
        const bus = new EventBus();
        const metric = new MetricsEngine();
        const engine = new TypingEngine(bus, metric);

        const pySnippet = SNIPPETS.find((s) => s.id === 'py-binary-search')!;
        const javaSnippet = SNIPPETS.find((s) => s.id === 'java-fast-io')!;

        engine.loadSnippet(pySnippet);
        expect(engine.getState()).toBe('IDLE');

        const resetSpy = vi.fn();
        bus.on('SESSION_RESET', resetSpy);

        engine.handleKey('d', false, false);
        engine.handleKey('e', false, false);
        expect(engine.getState()).toBe('ACTIVE');

        engine.loadSnippet(javaSnippet);

        expect(engine.getState()).toBe('IDLE');
        expect(resetSpy).toHaveBeenCalledTimes(1);

        engine.handleKey('p', false, false);
        expect(engine.getState()).toBe('ACTIVE');
    });

    it('should process keystrokes with average execution latency well below 16ms (NFR-01)', () => {
        const bus = new EventBus();
        const metric = new MetricsEngine();
        const engine = new TypingEngine(bus, metric);
        const snippet = SNIPPETS.find((s) => s.id === 'py-binary-search')!;
        engine.loadSnippet(snippet);

        const iterations = 1000;
        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
            if (i % 2 === 0) {
                engine.handleKey('a', false, false);
            } else {
                engine.handleKey('Backspace', true, false);
            }
        }

        const duration = performance.now() - start;
        const avgLatencyMs = duration / iterations;

        console.log(`[Benchmark NFR-01] Average Keystroke Latency: ${avgLatencyMs.toFixed(4)} ms`);

        expect(avgLatencyMs).toBeLessThan(16);
        expect(avgLatencyMs).toBeLessThan(1.0);
    });

    it('should handle rapid cycling across languages without memory leaks or state corruption', () => {
        const bus = new EventBus();
        const metric = new MetricsEngine();
        const engine = new TypingEngine(bus, metric);

        for (let i = 0; i < 50; i++) {
            const lang = i % 2 === 0 ? 'python' : 'java';
            const snippet = getRandomSnippet(lang);
            engine.loadSnippet(snippet);

            expect(engine.getState()).toBe('IDLE');
            expect(engine.getCursorIndex()).toBe(0);
        }

        const activeSnippet = (engine as any).snippet;
        const firstChar = activeSnippet.code[0];
        engine.handleKey(firstChar, false, false);

        expect(engine.getState()).toBe('ACTIVE');
        expect(engine.getCursorIndex()).toBe(1);
    });


})