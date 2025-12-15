import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EditableTitle } from '../ui/EditableTitle';

// Wrapper component for router context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
);

describe('EditableTitle', () => {
    const mockOnSave = vi.fn();

    beforeEach(() => {
        mockOnSave.mockClear();
    });

    it('renders title in view mode', () => {
        render(<EditableTitle title="Test Manga" onSave={mockOnSave} />, { wrapper: TestWrapper });

        expect(screen.getByText('Test Manga')).toBeInTheDocument();
    });

    it('switches to edit mode on click', () => {
        render(<EditableTitle title="Test Manga" onSave={mockOnSave} />, { wrapper: TestWrapper });

        fireEvent.click(screen.getByText('Test Manga'));

        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveValue('Test Manga');
    });

    it('shows save and cancel buttons in edit mode', () => {
        render(<EditableTitle title="Test Manga" onSave={mockOnSave} />, { wrapper: TestWrapper });

        fireEvent.click(screen.getByText('Test Manga'));

        expect(screen.getByText('Guardar')).toBeInTheDocument();
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('cancels editing on Escape key', () => {
        render(<EditableTitle title="Original Title" onSave={mockOnSave} />, { wrapper: TestWrapper });

        // Enter edit mode
        fireEvent.click(screen.getByText('Original Title'));

        // Change value
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'New Title' } });

        // Press Escape
        fireEvent.keyDown(input, { key: 'Escape' });

        // Should revert to view mode with original title
        expect(screen.getByText('Original Title')).toBeInTheDocument();
        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('calls onSave on Enter key with new value', async () => {
        mockOnSave.mockResolvedValue(undefined);

        render(<EditableTitle title="Original Title" onSave={mockOnSave} />, { wrapper: TestWrapper });

        // Enter edit mode
        fireEvent.click(screen.getByText('Original Title'));

        // Change value
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'New Title' } });

        // Press Enter
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith('New Title');
        });
    });

    it('does not call onSave if value unchanged', async () => {
        render(<EditableTitle title="Same Title" onSave={mockOnSave} />, { wrapper: TestWrapper });

        // Enter edit mode
        fireEvent.click(screen.getByText('Same Title'));

        // Press Enter without changing
        const input = screen.getByRole('textbox');
        fireEvent.keyDown(input, { key: 'Enter' });

        // Should not call onSave
        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('cancels when clicking Cancel button', () => {
        render(<EditableTitle title="Test Title" onSave={mockOnSave} />, { wrapper: TestWrapper });

        // Enter edit mode
        fireEvent.click(screen.getByText('Test Title'));

        // Click cancel
        fireEvent.click(screen.getByText('Cancelar'));

        // Should be back to view mode
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(mockOnSave).not.toHaveBeenCalled();
    });
});
