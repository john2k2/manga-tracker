import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditableField } from '../useMangaCard';

describe('useEditableField', () => {
    it('initializes with correct values', () => {
        const onSave = vi.fn();
        const { result } = renderHook(() =>
            useEditableField({ initialValue: 'Test', onSave })
        );

        expect(result.current.isEditing).toBe(false);
        expect(result.current.value).toBe('Test');
        expect(result.current.isSaving).toBe(false);
    });

    it('starts editing with current value', () => {
        const onSave = vi.fn();
        const { result } = renderHook(() =>
            useEditableField({ initialValue: 'Initial', onSave })
        );

        act(() => {
            result.current.startEditing();
        });

        expect(result.current.isEditing).toBe(true);
        expect(result.current.value).toBe('Initial');
    });

    it('cancels editing and resets value', () => {
        const onSave = vi.fn();
        const { result } = renderHook(() =>
            useEditableField({ initialValue: 'Original', onSave })
        );

        act(() => {
            result.current.startEditing();
            result.current.setValue('Changed');
        });

        expect(result.current.value).toBe('Changed');

        act(() => {
            result.current.cancelEditing();
        });

        expect(result.current.isEditing).toBe(false);
        expect(result.current.value).toBe('Original');
    });

    it('calls onSave when saving with new value', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() =>
            useEditableField({ initialValue: 'Old', onSave })
        );

        act(() => {
            result.current.startEditing();
            result.current.setValue('New');
        });

        await act(async () => {
            await result.current.save();
        });

        expect(onSave).toHaveBeenCalledWith('New');
        expect(result.current.isEditing).toBe(false);
    });

    it('does not call onSave when value unchanged', async () => {
        const onSave = vi.fn();
        const { result } = renderHook(() =>
            useEditableField({ initialValue: 'Same', onSave })
        );

        act(() => {
            result.current.startEditing();
        });

        await act(async () => {
            await result.current.save();
        });

        expect(onSave).not.toHaveBeenCalled();
        expect(result.current.isEditing).toBe(false);
    });

    it('does not call onSave when value is empty', async () => {
        const onSave = vi.fn();
        const { result } = renderHook(() =>
            useEditableField({ initialValue: 'Test', onSave })
        );

        act(() => {
            result.current.startEditing();
            result.current.setValue('');
        });

        await act(async () => {
            await result.current.save();
        });

        expect(onSave).not.toHaveBeenCalled();
        expect(result.current.isEditing).toBe(false);
    });

    it('keeps editing open if onSave throws', async () => {
        const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
        const { result } = renderHook(() =>
            useEditableField({ initialValue: 'Test', onSave })
        );

        act(() => {
            result.current.startEditing();
            result.current.setValue('New Value');
        });

        await act(async () => {
            await result.current.save();
        });

        expect(onSave).toHaveBeenCalled();
        // Should stay in editing mode on error
        expect(result.current.isEditing).toBe(true);
    });
});

// Note: useDropdown and useClickOutside are tested via component integration tests
// as they rely on DOM refs which don't work well with renderHook alone
