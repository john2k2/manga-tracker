import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock window.matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { }, // Deprecated
        removeListener: () => { }, // Deprecated
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
});

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
    root: Document | Element | null = null;
    rootMargin: string = '';
    thresholds: ReadonlyArray<number> = [];

    observe = () => { };
    unobserve = () => { };
    disconnect = () => { };
    takeRecords = () => [];
}

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
    observe = () => { };
    unobserve = () => { };
    disconnect = () => { };
}

Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: MockResizeObserver,
});

// Suppress console.error for expected errors in tests
const originalError = console.error;
console.error = (...args: unknown[]) => {
    // Ignore React act() warnings and expected test errors
    const message = args[0];
    if (
        typeof message === 'string' &&
        (message.includes('Warning: ReactDOM.render is no longer supported') ||
            message.includes('act(...)'))
    ) {
        return;
    }
    originalError.apply(console, args);
};
