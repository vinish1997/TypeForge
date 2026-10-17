import { IEventBus, IMetricsEngine, ITypingEngine, SessionState, CodeSnippet } from '../types';

export class TypingEngine implements ITypingEngine {
    private state: SessionState = 'IDLE';
    private snippet: CodeSnippet | null = null;
    private cursorIndex: number = 0;
    private currentLineNumber: number = 0;
    private charElements: HTMLElement[] = [];
    private errorIndices: Set<number> = new Set();

    constructor(
        private bus: IEventBus,
        private metricsEngine?: IMetricsEngine
    ) { }

    getState(): SessionState {
        return this.state;
    }

    getCursorIndex(): number {
        return this.cursorIndex;
    }

    getCurrentLineNumber(): number {
        return this.currentLineNumber;
    }

    attachDOM(elements: HTMLElement[]): void {
        this.charElements = elements;
        this.updateCaretPosition();
    }

    loadSnippet(snippet: CodeSnippet) {
        this.snippet = snippet;
        this.reset();
    }

    pause() {
        if (this.state === 'ACTIVE') {
            this.state = 'PAUSED';
            const pausedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
            this.metricsEngine?.pause(pausedAt);
            this.bus.emit('SESSION_PAUSED', { pausedAt: pausedAt });
        }
    }

    resume() {
        if (this.state === 'PAUSED') {
            this.state = 'ACTIVE';
            const resumedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
            this.metricsEngine?.resume(resumedAt);
            this.bus.emit('SESSION_RESUMED', { resumedAt: resumedAt, pauseDurationMs: 0 });
        }
    }

    reset() {
        this.state = 'IDLE';
        this.cursorIndex = 0;
        this.currentLineNumber = 1;
        this.errorIndices.clear();
        for (const el of this.charElements) {
            el.className = 'char char-pending';
        }
        this.updateCaretPosition();

        if (this.snippet) {
            this.bus.emit('SESSION_RESET', { snippetId: this.snippet?.id });
        }
    }

    private updateCaretPosition(): void {
        if (this.charElements.length === 0) return;

        for (let i = 0; i < this.charElements.length; i++) {
            this.charElements[i]?.classList.remove('caret');
        }

        if (this.cursorIndex < this.charElements.length) {
            this.charElements[this.cursorIndex]?.classList.add('caret');
        }
    }

    handleKey(key: string, isBackspace: boolean, isEnter: boolean): void {
        if (!this.snippet) return;
        if (this.state === 'COMPLETED' || this.state === 'PAUSED') return;

        if (this.state === 'IDLE') {
            if (isBackspace) return;
            this.state = 'ACTIVE';
            const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
            this.metricsEngine?.start(now);
            this.bus.emit('SESSION_STARTED', { startTime: now, snippetId: this.snippet?.id });
        }

        if (isBackspace) {
            if (this.cursorIndex <= 0) return;

            const currentLine = this.snippet.lines?.find((l) => l.lineNumber === this.currentLineNumber);

            if (currentLine && this.cursorIndex === currentLine.firstCodeCharIndex && this.currentLineNumber > 1) {
                const prevLine = this.snippet.lines?.find((l) => l.lineNumber === this.currentLineNumber - 1);
                if (prevLine) {
                    for (let i = currentLine.startIndex; i < currentLine.firstCodeCharIndex; i++) {
                        const indentEl = this.charElements[i];
                        if (indentEl) indentEl.className = 'char char-pending';
                    }
                    this.cursorIndex = prevLine.endIndex;
                    this.currentLineNumber--;
                    const prevLineEl = this.charElements[this.cursorIndex];
                    if (prevLineEl) prevLineEl.className = 'char char-pending';

                    const wasError = this.errorIndices.has(this.cursorIndex);
                    this.errorIndices.delete(this.cursorIndex);
                    this.metricsEngine?.recordBackspace(wasError);
                    this.updateCaretPosition();
                    return;
                }
            }

            this.cursorIndex--;
            const wasError = this.errorIndices.has(this.cursorIndex);
            this.errorIndices.delete(this.cursorIndex);
            const errorEl = this.charElements[this.cursorIndex];
            if (errorEl) errorEl.className = 'char char-pending';

            this.metricsEngine?.recordBackspace(wasError);
            this.updateCaretPosition();
            return;
        }

        if (isEnter) {
            const expected = this.snippet.code[this.cursorIndex];
            if (expected === '\n') {
                const newLineEl = this.charElements[this.cursorIndex];
                if (newLineEl) newLineEl.className = 'char char-correct';

                this.metricsEngine?.recordKeystroke(true, false);
                this.bus.emit('KEYSTROKE_PROCESSED', {
                    index: this.cursorIndex,
                    char: '\n',
                    isCorrect: true,
                    isIndent: false,
                });
                this.currentLineNumber++;
                const nextLine = this.snippet.lines?.find((l) => l.lineNumber === this.currentLineNumber);

                if (nextLine && nextLine.indentationLength > 0) {
                    for (let i = nextLine.startIndex; i < nextLine.firstCodeCharIndex; i++) {
                        const indentEl = this.charElements[i];
                        if (indentEl) indentEl.className = 'char char-correct';

                        this.metricsEngine?.recordKeystroke(true, true);
                        this.bus.emit('KEYSTROKE_PROCESSED', {
                            index: i,
                            char: ' ',
                            isCorrect: true,
                            isIndent: true,
                        })
                    }
                    this.bus.emit('LINE_ADVANCED', {
                        fromLine: this.currentLineNumber - 1,
                        toLine: this.currentLineNumber,
                        skippedIndentChars: nextLine.indentationLength,
                    })
                    this.cursorIndex = nextLine.firstCodeCharIndex;
                } else {
                    this.cursorIndex++;
                }
            } else {
                const errorEl = this.charElements[this.cursorIndex];
                if (errorEl) errorEl.className = 'char char-error';

                this.errorIndices.add(this.cursorIndex);
                this.metricsEngine?.recordKeystroke(false, false);
                this.bus.emit('KEYSTROKE_PROCESSED', {
                    index: this.cursorIndex,
                    char: '\n',
                    isCorrect: false,
                    isIndent: false,
                });
                this.cursorIndex++;
            }

            if (this.cursorIndex >= this.snippet.code.length) {
                this.completeSession();
                return;
            }
            this.updateCaretPosition();
            return;
        }

        const expected = this.snippet.code[this.cursorIndex];
        const isCorrect = key === expected;

        const charEl = this.charElements[this.cursorIndex];
        if (charEl) {
            charEl.className = isCorrect ? 'char char-correct' : 'char char-incorrect';
        }

        if (!isCorrect) {
            this.errorIndices.add(this.cursorIndex);
        }

        this.metricsEngine?.recordKeystroke(isCorrect, false);
        this.bus.emit('KEYSTROKE_PROCESSED', {
            index: this.cursorIndex,
            char: key,
            isCorrect: isCorrect,
            isIndent: false,
        });

        this.cursorIndex++;
        if (this.cursorIndex >= this.snippet.code.length) {
            this.completeSession();
            return;
        }
        this.updateCaretPosition();
    }

    private completeSession() {
        this.state = 'COMPLETED';
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const summary = this.metricsEngine ? this.metricsEngine.finalize(now) : {
            netWpm: 0, grossWpm: 0, accuracy: 100, elapsedTimeMs: 0, totalKeystrokes: 0, correctKeystrokes: 0, errorCount: 0, backspaceCount: 0, uncorrectedErrors: 0
        };

        this.bus.emit('SESSION_COMPLETED', { summary });

        for (const el of this.charElements) {
            el.classList.remove('caret');
        }
    }

}