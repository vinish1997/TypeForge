import { IMetricsEngine, LiveMetricsUpdate, SessionMetrics } from '../types';

export class MetricsEngine implements IMetricsEngine {
    private startTimeMs: number | null = null;
    private totalPausedDurationMs: number = 0;
    private lastPausedAt: number | null = null;

    private totalKeystrokes: number = 0;
    private correctKeystrokes: number = 0;
    private errorCount: number = 0;
    private backspaceCount: number = 0;
    private uncorrectedErrors: number = 0;

    start(startTime: number): void {
        this.startTimeMs = startTime;
        this.totalPausedDurationMs = 0;
        this.lastPausedAt = null;
        this.totalKeystrokes = 0;
        this.correctKeystrokes = 0;
        this.errorCount = 0;
        this.backspaceCount = 0;
        this.uncorrectedErrors = 0;
    }

    recordKeystroke(isCorrect: boolean, isIndent: boolean): void {
        this.totalKeystrokes++;
        if (isIndent || isCorrect) {
            this.correctKeystrokes++;
        } else {
            this.errorCount++;
            this.uncorrectedErrors++;
        }
    }

    recordBackspace(wasError: boolean = false): void {
        this.backspaceCount++;
        this.totalKeystrokes++;
        if (wasError) {
            this.uncorrectedErrors = Math.max(0, this.uncorrectedErrors - 1);
        } else {
            this.correctKeystrokes = Math.max(0, this.correctKeystrokes - 1);
        }
    }

    pause(pausedAt: number): void {
        if (this.lastPausedAt === null) {
            this.lastPausedAt = pausedAt;
        }
    }

    resume(resumedAt: number): void {
        if (this.lastPausedAt !== null) {
            this.totalPausedDurationMs += Math.max(0, resumedAt - this.lastPausedAt);
            this.lastPausedAt = null;
        }
    }

    private calculateActiveTimeMs(currentTimeMs: number): number {
        if (this.startTimeMs === null) return 0;
        let activeMs = currentTimeMs - this.startTimeMs - this.totalPausedDurationMs;
        if (this.lastPausedAt !== null) {
            activeMs -= Math.max(0, currentTimeMs - this.lastPausedAt);
        }
        return Math.max(0, activeMs);
    }

    getLiveUpdate(): LiveMetricsUpdate {
        if (this.startTimeMs === null) {
            return {
                liveWpm: null,
                accuracy: 100,
                elapsedSeconds: 0,
            };
        }
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const activeMs = this.calculateActiveTimeMs(now);
        const elapsedSeconds = Math.floor(activeMs / 1000);
        const elapsedMinutes = activeMs / 60000;

        const accuracy = this.totalKeystrokes > 0 ? (this.correctKeystrokes / this.totalKeystrokes) * 100 : 100;

        let liveWpm: number | null = null;
        if (elapsedSeconds > 3 && elapsedMinutes > 0) {
            const correctWords = this.correctKeystrokes / 5;
            const net = Math.max(0, (correctWords - this.uncorrectedErrors) / elapsedMinutes);
            liveWpm = Math.round(net);
        }

        return {
            liveWpm,
            accuracy: Math.round(accuracy * 10) / 10,
            elapsedSeconds,
        };
    }

    finalize(endTime: number): SessionMetrics {
        const activeMs = this.calculateActiveTimeMs(endTime);
        const elapsedMinutes = activeMs / 60000;

        const grossWpm = elapsedMinutes > 0 ? (this.totalKeystrokes / 5) / elapsedMinutes : 0;
        const correctWords = this.correctKeystrokes / 5;
        const netWpm = elapsedMinutes > 0 ? Math.max(0, (correctWords - this.uncorrectedErrors) / elapsedMinutes) : 0;

        const accuracy = this.totalKeystrokes > 0 ? (this.correctKeystrokes / this.totalKeystrokes) * 100 : 100;

        return {
            netWpm: Math.round(netWpm * 10) / 10,
            grossWpm: Math.round(grossWpm * 10) / 10,
            accuracy: Math.round(accuracy * 10) / 10,
            elapsedTimeMs: activeMs,
            totalKeystrokes: this.totalKeystrokes,
            correctKeystrokes: this.correctKeystrokes,
            errorCount: this.errorCount,
            backspaceCount: this.backspaceCount,
            uncorrectedErrors: this.uncorrectedErrors,
        };
    }
}