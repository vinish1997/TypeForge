import { EventBus } from "./core/EventBus";
import { MetricsEngine } from "./core/MetricsEngine";
import { TypingEngine } from "./core/TypingEngine";
import { DOMRenderer } from "./ui/DOMRenderer";
import { InputController } from "./ui/InputController";
import { getRandomSnippet } from "./data/corpus";
import { SupportedLanguage, CodeSnippet } from "./types";


const canvas = document.getElementById('code-canvas') as HTMLElement;
const wpmEl = document.getElementById('metric-wpm') as HTMLElement;
const accEl = document.getElementById('metric-acc') as HTMLElement;
const timeEl = document.getElementById('metric-time') as HTMLElement;
const titleEl = document.getElementById('snippet-title') as HTMLElement;
const difficultyEl = document.getElementById('snippet-difficulty') as HTMLElement;
const pythonBtn = document.getElementById('btn-python') as HTMLButtonElement;
const javaBtn = document.getElementById('btn-java') as HTMLButtonElement;
const nextBtn = document.getElementById('btn-next') as HTMLButtonElement;
const retryBtn = document.getElementById('btn-retry') as HTMLButtonElement;
const pauseOverlay = document.getElementById('pause-overlay') as HTMLElement;
const resultsModal = document.getElementById('results-modal') as HTMLElement;
const finalWpmEl = document.getElementById('final-wpm') as HTMLElement;
const finalAccEl = document.getElementById('final-acc') as HTMLElement;
const finalTimeEl = document.getElementById('final-time') as HTMLElement;
const finalErrorsEl = document.getElementById('final-errors') as HTMLElement;


const bus = new EventBus();
const metrics = new MetricsEngine();
const engine = new TypingEngine(bus, metrics);
const renderer = new DOMRenderer(canvas);
const inputController = new InputController(engine);
let currentLanguage: SupportedLanguage = 'python';
let currentSnippet: CodeSnippet;



function loadNewSnippet(language: SupportedLanguage, currentId?: string) {
    currentSnippet = getRandomSnippet(language, currentId);
    const charElements = renderer.render(currentSnippet);

    engine.attachDOM(charElements);
    engine.loadSnippet(currentSnippet);

    titleEl.textContent = currentSnippet.title;
    difficultyEl.textContent = currentSnippet.difficulty;
    wpmEl.textContent = '-';
    accEl.textContent = '100%';
    timeEl.textContent = '0s';

    pauseOverlay.classList.add('hidden');
    resultsModal.classList.add('hidden');
}

setInterval(() => {
    if (engine.getState() === 'ACTIVE') {
        const update = metrics.getLiveUpdate();
        wpmEl.textContent = update.liveWpm !== null ? update.liveWpm.toString() : '—';
        accEl.textContent = `${update.accuracy}%`;
        timeEl.textContent = `${update.elapsedSeconds}s`;
    }
}, 1000);

bus.on('SESSION_PAUSED', () => {
    pauseOverlay.classList.remove('hidden');
});

bus.on('SESSION_RESUMED', () => {
    pauseOverlay.classList.add('hidden');
});

bus.on('SESSION_COMPLETED', ({ summary }) => {
    resultsModal.classList.remove('hidden');
    finalWpmEl.textContent = summary.netWpm.toString();
    finalAccEl.textContent = `${summary.accuracy}%`;
    finalTimeEl.textContent = `${Math.round(summary.elapsedTimeMs / 1000)}s`;
    finalErrorsEl.textContent = summary.errorCount.toString();
});

pythonBtn.addEventListener('click', () => {
    currentLanguage = 'python';
    pythonBtn.classList.add('active');
    javaBtn.classList.remove('active');
    loadNewSnippet('python');
});

javaBtn.addEventListener('click', () => {
    currentLanguage = 'java';
    javaBtn.classList.add('active');
    pythonBtn.classList.remove('active');
    loadNewSnippet('java');
});

nextBtn.addEventListener('click', () => {
    loadNewSnippet(currentLanguage, currentSnippet.id);
});

retryBtn.addEventListener('click', () => {
    loadNewSnippet(currentLanguage);
});

pauseOverlay.addEventListener('click', () => {
    engine.resume();
});

inputController.start();
loadNewSnippet('python');

