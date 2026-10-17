import { CodeSnippet } from '../types';

export class DOMRenderer {
    constructor(private container: HTMLElement) { }

    clear(): void {
        this.container.innerHTML = '';
    }

    render(snippet: CodeSnippet): HTMLElement[] {
        this.clear();
        const charElements: HTMLElement[] = [];
        const lines = snippet.code.split('\n');
        let globalIndex = 0;

        for (let i = 0; i < lines.length; i++) {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'code-line';
            lineDiv.setAttribute('data-line', (i + 1).toString());
            const gutterSpan = document.createElement('span');
            gutterSpan.className = 'line-gutter';
            gutterSpan.textContent = (i + 1).toString();
            lineDiv.appendChild(gutterSpan);
            const contentSpan = document.createElement('span');
            contentSpan.className = 'line-content';
            const line = lines[i] || "";
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                const charSpan = document.createElement('span');
                charSpan.setAttribute('data-index', globalIndex.toString());
                charSpan.className = 'char char-pending';
                charSpan.textContent = char || ' ';
                contentSpan.appendChild(charSpan);
                charElements.push(charSpan);
                globalIndex++;
            }
            if (i < lines.length - 1) {
                const newLineEl = document.createElement('span');
                newLineEl.className = 'char char-pending char-newline';
                newLineEl.setAttribute('data-index', globalIndex.toString());
                newLineEl.textContent = '\u23ce';
                charElements.push(newLineEl);
                contentSpan.appendChild(newLineEl);
                globalIndex++;
            }
            lineDiv.appendChild(contentSpan);
            this.container.appendChild(lineDiv);
        }
        return charElements;
    }
}