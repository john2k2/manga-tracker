import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardActions } from '../ui/CardActions';

describe('CardActions', () => {
    it('renders report and delete buttons', () => {
        const onReport = vi.fn();
        const onDelete = vi.fn();

        render(<CardActions onReport={onReport} onDelete={onDelete} />);

        expect(screen.getByTitle('Report Issue')).toBeInTheDocument();
        expect(screen.getByTitle('Remove Manga')).toBeInTheDocument();
    });

    it('calls onReport when report button clicked', () => {
        const onReport = vi.fn();
        const onDelete = vi.fn();

        render(<CardActions onReport={onReport} onDelete={onDelete} />);

        fireEvent.click(screen.getByTitle('Report Issue'));

        expect(onReport).toHaveBeenCalledTimes(1);
        expect(onDelete).not.toHaveBeenCalled();
    });

    it('calls onDelete when delete button clicked', () => {
        const onReport = vi.fn();
        const onDelete = vi.fn();

        render(<CardActions onReport={onReport} onDelete={onDelete} />);

        fireEvent.click(screen.getByTitle('Remove Manga'));

        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onReport).not.toHaveBeenCalled();
    });

    it('has correct accessibility labels', () => {
        const onReport = vi.fn();
        const onDelete = vi.fn();

        render(<CardActions onReport={onReport} onDelete={onDelete} />);

        expect(screen.getByLabelText('Reportar problema')).toBeInTheDocument();
        expect(screen.getByLabelText('Eliminar manga')).toBeInTheDocument();
    });
});
