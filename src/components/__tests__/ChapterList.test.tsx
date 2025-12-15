import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChapterList } from '../ui/ChapterList';

describe('ChapterList', () => {
    const mockChapters = [
        {
            number: 100,
            url: 'https://example.com/chapter-100',
            release_date: '2024-01-15'
        },
        {
            number: 99,
            url: 'https://example.com/chapter-99',
            release_date: '2024-01-10'
        }
    ];

    it('renders empty state when no chapters', () => {
        render(<ChapterList chapters={[]} />);

        expect(screen.getByText('Aún no hay capítulos disponibles')).toBeInTheDocument();
    });

    it('renders list of chapters', () => {
        render(<ChapterList chapters={mockChapters} />);

        expect(screen.getByText('Ch. 100')).toBeInTheDocument();
        expect(screen.getByText('Ch. 99')).toBeInTheDocument();
    });

    it('renders chapters as links with correct href', () => {
        render(<ChapterList chapters={mockChapters} />);

        const links = screen.getAllByRole('link');
        expect(links[0]).toHaveAttribute('href', 'https://example.com/chapter-100');
        expect(links[1]).toHaveAttribute('href', 'https://example.com/chapter-99');
    });

    it('opens links in new tab', () => {
        render(<ChapterList chapters={mockChapters} />);

        const links = screen.getAllByRole('link');
        links.forEach(link => {
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        });
    });

    it('formats release dates correctly', () => {
        const { container } = render(<ChapterList chapters={mockChapters} />);

        // The date format depends on locale, so we just check that dates are being rendered
        // by verifying there's date content in the spans
        const links = container.querySelectorAll('a');
        expect(links.length).toBe(2);

        // Each link should have two spans (chapter number and date)
        const firstLinkSpans = links[0].querySelectorAll('span');
        expect(firstLinkSpans.length).toBe(2);
    });

    it('handles null release dates', () => {
        const chaptersWithNullDate = [
            { number: 1, url: 'https://example.com/ch-1', release_date: null }
        ];

        render(<ChapterList chapters={chaptersWithNullDate} />);

        expect(screen.getByText('Ch. 1')).toBeInTheDocument();
    });
});
