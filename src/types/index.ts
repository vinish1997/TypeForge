// ==========================================
// 1. Domain & Corpus Models
// ==========================================
export type SupportedLanguage = 'python' | 'java';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface CodeSnippet {
    id: string;
    language: SupportedLanguage;
    title: string;
    difficulty: DifficultyLevel;
    category: string;
    code: string;
    lines?: IndexedLine[]
}

export interface IndexedLine {
    lineNumber: number; // 1-indexed line number
    startIndex: number; // global character index where line starts
    endIndex: number; // global character index where newline occurs
    indentationLength: number; // number of leading spaces (e.g., 4)
    firstCodeCharIndex: number; // global index where visible code begins
}

// ==========================================
// 2. Session & Metrics Models
// ==========================================
export type SessionState = 'IDLE' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface SessionMetrics {
    netWpm: number;
    grossWpm: number;
    accuracy: number;
    elapsedTimeMs: number;
    totalKeystrokes: number;
    correctKeystrokes: number;
    errorCount: number;
    backspaceCount: number;
    uncorrectedErrors: number;
}

export interface LiveMetricsUpdate {
    liveWpm: number | null; // null during 3-second warm-up window
    accuracy: number;
    elapsedSeconds: number;
}

// ==========================================
// 3. Type Event Bus Contract
// ==========================================
export interface EventMap {
    'SESSION_STARTED': { startTime: number; snippetId: string };
    'KEYSTROKE_PROCESSED': {
        index: number;
        char: string;
        isCorrect: boolean;
        isIndent: boolean;
    };
    'LINE_ADVANCED': {
        fromLine: number;
        toLine: number;
        skippedIndentChars: number;
    };
    'SESSION_PAUSED': { pausedAt: number };
    'SESSION_RESUMED': { resumedAt: number; pauseDurationMs: number };
    'SESSION_COMPLETED': { summary: SessionMetrics };
    'SESSION_RESET': { snippetId: string };
    'METRICS_TICK': LiveMetricsUpdate;
}

export interface IEventBus {
    on<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void): () => void;
    emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void;
}

// ==========================================
// 4. Component Service Contracts
// ==========================================
export interface ITypingEngine {
    loadSnippet(snippet: CodeSnippet): void;
    handleKey(key: string, isBackspace: boolean, isEnter: boolean): void;
    pause(): void;
    resume(): void;
    reset(): void;
    getState(): SessionState;
}

export interface IMetricsEngine {
    start(startTime: number): void;
    recordKeystroke(isCorrect: boolean, isIndent: boolean): void;
    recordBackspace(wasError?: boolean): void;
    pause(pausedAt: number): void;
    resume(resumedAt: number): void;
    finalize(endTime: number): SessionMetrics;
    getLiveUpdate(): LiveMetricsUpdate;
}