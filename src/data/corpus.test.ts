import { describe, it, expect } from 'vitest';
import { indexSnippetLines, getRandomSnippet, SNIPPETS } from './corpus';

describe('indexSnippetLines', () => {
    it('should index correctly a multiline code snippet', () => {
        const sampleCode = 'def add(a, b):\n    return a + b';

        const indexed = indexSnippetLines(sampleCode);

        expect(indexed).toHaveLength(2);
        expect(indexed[0]).toEqual({
            lineNumber: 1,
            startIndex: 0,
            endIndex: 14,
            indentationLength: 0,
            firstCodeCharIndex: 0
        })
        expect(indexed[1]).toEqual({
            lineNumber: 2,
            startIndex: 15,
            endIndex: 31,
            indentationLength: 4,
            firstCodeCharIndex: 19
        })
    });
});

describe('SNIPPETS', () => {
    it('should include valid pre-indexed snippets for all supported languages', () => {
        expect(SNIPPETS.length).toBeGreaterThan(0);
        const languages = new Set(SNIPPETS.map(s => s.language));
        expect(languages.has('python')).toBe(true);
        expect(languages.has('java')).toBe(true);
        for (const snippet of SNIPPETS) {
            expect(snippet.lines).toBeDefined();
            expect(snippet.lines?.length).toBe(snippet.code.split('\n').length);
        }
    });
});

describe('getRandomSnippet', () => {
    it('should filter snippets strictly by requested language', () => {
        const pythonSnippet = getRandomSnippet('python');
        expect(pythonSnippet.language).toBe('python');

        const javaSnippet = getRandomSnippet('java');
        expect(javaSnippet.language).toBe('java');
    });

    it('should avoid repeating current snippet when alternatives exist', () => {
        const first = getRandomSnippet('python');
        const next = getRandomSnippet('python', first.id);
        expect(next.id).not.toBe(first.id);
    });
});
