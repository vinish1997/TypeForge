import { CodeSnippet, IndexedLine, SupportedLanguage } from '../types';

export function indexSnippetLines(code: string): IndexedLine[] {
    const rawLines = code.split('\n');
    const indexed: IndexedLine[] = [];
    let globalIndex = 0;

    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i] ?? '';
        const startIndex = globalIndex;
        const endIndex = startIndex + line.length;

        let leadingSpaces = 0;
        while (leadingSpaces < line.length && line[leadingSpaces] === ' ') {
            leadingSpaces++;
        }

        indexed.push({
            lineNumber: i + 1,
            startIndex,
            endIndex,
            indentationLength: leadingSpaces,
            firstCodeCharIndex: startIndex + leadingSpaces,
        })

        globalIndex = endIndex + 1;
    }
    return indexed;
}

// 1. Raw declarative snippets (strictly typed without lines)
const RAW_SNIPPETS: Omit<CodeSnippet, 'lines'>[] = [
    {
        id: 'py-binary-search',
        language: 'python',
        title: 'Binary Search',
        difficulty: 'Easy',
        category: 'Algorithms',
        code: `def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    },
    {
        id: 'py-two-sum-sorted',
        language: 'python',
        title: 'Two Pointers (Sorted Sum)',
        difficulty: 'Easy',
        category: 'Two Pointers',
        code: `def two_sum_sorted(numbers, target):
    left = 0
    right = len(numbers) - 1
    while left < right:
        curr = numbers[left] + numbers[right]
        if curr == target:
            return [left + 1, right + 1]
        if curr < target:
            left += 1
        else:
            right -= 1
    return []`,
    },
    {
        id: 'java-binary-search',
        language: 'java',
        title: 'Binary Search',
        difficulty: 'Easy',
        category: 'Algorithms',
        code: `public int binarySearch(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}`,
    },
    {
        id: 'java-fast-io',
        language: 'java',
        title: 'Fast I/O Scanner',
        difficulty: 'Medium',
        category: 'Competitive I/O',
        code: `public static class FastScanner {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    StringTokenizer st = new StringTokenizer("");
    String next() throws IOException {
        while (!st.hasMoreTokens()) {
            st = new StringTokenizer(br.readLine());
        }
        return st.nextToken();
    }
    int nextInt() throws IOException {
        return Integer.parseInt(next());
    }
}`,
    },
];

export const SNIPPETS: CodeSnippet[] = RAW_SNIPPETS.map((snippet) => ({
    ...snippet,
    lines: indexSnippetLines(snippet.code),
}));

export function getRandomSnippet(language: SupportedLanguage, currentId?: string): CodeSnippet {
    const pool = SNIPPETS.filter((s) => s.language === language);
    const eligible = pool.length > 1 && currentId ? pool.filter((s) => s.id !== currentId) : pool;
    const randomIndex = Math.floor(Math.random() * eligible.length);
    return eligible[randomIndex] ?? pool[0]!;
}