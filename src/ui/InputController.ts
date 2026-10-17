import { ITypingEngine } from '../types';

export class InputController {
    constructor(private typingEngine: ITypingEngine) {
        this.typingEngine = typingEngine;
    }

    start() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('blur', this.handleBlur);
        window.addEventListener('focus', this.handleFocus);

    }

    stop() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('blur', this.handleBlur);
        window.removeEventListener('focus', this.handleFocus);
    }

    private handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key === ' ' || event.key === 'Tab' || event.key === 'Backspace') {
            event.preventDefault();
        }

        if (['Meta', 'Shift', 'Alt', 'Control', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            return;
        }

        const isBackspace = event.key === 'Backspace';
        const isEnter = event.key === 'Enter';
        this.typingEngine.handleKey(event.key, isBackspace, isEnter);
    }

    private handleBlur = (): void => {
        this.typingEngine.pause();
    }

    private handleFocus = (): void => {
        this.typingEngine.resume();
    }
}