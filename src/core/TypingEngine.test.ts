import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TypingEngine } from './TypingEngine';
import { EventBus } from './EventBus';
import { MetricsEngine } from './MetricsEngine';
import { CodeSnippet } from '../types';
import { indexSnippetLines } from '../data/corpus';

describe('TypingEngine', () => {
    let bus: EventBus;
    let metrics: MetricsEngine;
    let engine: TypingEngine;

    const sampleCode = 'def add(a, b):\n    return a + b';
    const mockSnippet: CodeSnippet = {
        id: 'test-snippet',
        language: 'python',
        title: 'Add Function',
        difficulty: 'Easy',
        category: 'Algorithms',
        code: sampleCode,
        lines: indexSnippetLines(sampleCode),
    };

    beforeEach(() => {
        bus = new EventBus();
        metrics = new MetricsEngine();
        engine = new TypingEngine(bus, metrics);
        engine.loadSnippet(mockSnippet);
    });

    it('should return IDLE state initially', () => {
        expect(engine.getState()).toBe('IDLE');
    });

    it('should start session on first keystroke', () => {
        engine.handleKey('d', false, false);
        expect(engine.getState()).toBe('ACTIVE');
    });

    it('should not process backspace on empty input', () => {
        const mockSpy = vi.spyOn(metrics, 'recordBackspace');
        engine.handleKey('d', true, false);
        expect(mockSpy).not.toHaveBeenCalled();
        expect(engine.getCursorIndex()).toBe(0);
    });

    it('should reset and go back to IDLE state', () => {
        engine.handleKey('d', false, false);
        engine.handleKey('e', false, false);
        engine.handleKey('f', false, false);
        engine.handleKey(' ', false, false);
        engine.handleKey('a', false, false);

        expect(engine.getState()).toBe('ACTIVE');

        engine.reset();

        expect(engine.getState()).toBe('IDLE');
        expect(engine.getCursorIndex()).toBe(0);
    });

    it('should handle enter correctly for new lines', () => {
        // Type 'def add(a, b):' (14 chars)
        engine.handleKey('d', false, false);
        engine.handleKey('e', false, false);
        engine.handleKey('f', false, false);
        engine.handleKey(' ', false, false);
        engine.handleKey('a', false, false);
        engine.handleKey('d', false, false);
        engine.handleKey('d', false, false);
        engine.handleKey('(', false, false);
        engine.handleKey('a', false, false);
        engine.handleKey(',', false, false);
        engine.handleKey(' ', false, false);
        engine.handleKey('b', false, false);
        engine.handleKey(')', false, false);
        engine.handleKey(':', false, false);
        engine.handleKey('\n', false, true);

        expect(engine.getCurrentLineNumber()).toBe(2);
        expect(engine.getCursorIndex()).toBe(19); // After '  ' (2 chars)
    });

    it('should atomically roll back to previous line on a single backspace at line start', () => {
        // Type through line 1: 'def add(a, b):'
        for (const char of 'def add(a, b):') {
            engine.handleKey(char, false, false);
        }
        // Press Enter -> auto-indent snaps cursor directly to index 19 on Line 2
        engine.handleKey('\n', false, true);
        expect(engine.getCursorIndex()).toBe(19);
        expect(engine.getCurrentLineNumber()).toBe(2);

        // Press Backspace ONCE:
        engine.handleKey('', true, false);

        // Atomically snaps back to end of line 1 (index 14)!
        expect(engine.getCurrentLineNumber()).toBe(1);
        expect(engine.getCursorIndex()).toBe(14);
    });


    it('should transition to COMPLETED when final character is typed', () => {
        const completionSpy = vi.fn();
        bus.on('SESSION_COMPLETED', completionSpy);

        for (const char of sampleCode) {
            engine.handleKey(char, false, char === '\n');
        }

        expect(engine.getState()).toBe('COMPLETED');
        expect(completionSpy).toHaveBeenCalledTimes(1);
    });

    it('should ignore keystrokes while PAUSED', () => {
        engine.handleKey('d', false, false);
        expect(engine.getState()).toBe('ACTIVE');

        engine.pause();
        expect(engine.getState()).toBe('PAUSED');

        // Keystrokes while paused should be dropped
        engine.handleKey('e', false, false);
        expect(engine.getCursorIndex()).toBe(1);

        engine.resume();
        expect(engine.getState()).toBe('ACTIVE');
        engine.handleKey('e', false, false);
        expect(engine.getCursorIndex()).toBe(2);
    });


});