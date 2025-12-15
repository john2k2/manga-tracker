import { useState, useRef, useEffect, useCallback } from 'react';

interface UseClickOutsideOptions {
    onClickOutside: () => void;
    enabled?: boolean;
}

/**
 * Hook to detect clicks outside a referenced element
 */
export function useClickOutside<T extends HTMLElement>(
    { onClickOutside, enabled = true }: UseClickOutsideOptions
) {
    const ref = useRef<T>(null);

    useEffect(() => {
        if (!enabled) return;

        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClickOutside();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClickOutside, enabled]);

    return ref;
}

interface UseEditableFieldOptions {
    initialValue: string;
    onSave: (value: string) => Promise<void>;
}

/**
 * Hook for managing editable field state
 */
export function useEditableField({ initialValue, onSave }: UseEditableFieldOptions) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const [isSaving, setIsSaving] = useState(false);

    const startEditing = useCallback(() => {
        setValue(initialValue);
        setIsEditing(true);
    }, [initialValue]);

    const cancelEditing = useCallback(() => {
        setIsEditing(false);
        setValue(initialValue);
    }, [initialValue]);

    const save = useCallback(async () => {
        if (!value || value === initialValue) {
            cancelEditing();
            return;
        }

        setIsSaving(true);
        try {
            await onSave(value);
            setIsEditing(false);
        } catch {
            // Error is handled by parent, keep editing open
        } finally {
            setIsSaving(false);
        }
    }, [value, initialValue, onSave, cancelEditing]);

    return {
        isEditing,
        value,
        setValue,
        isSaving,
        startEditing,
        cancelEditing,
        save
    };
}

interface UseDropdownOptions {
    onSelect?: (value: string) => void;
}

/**
 * Hook for managing dropdown state with click-outside handling
 */
export function useDropdown<T extends HTMLElement>({ onSelect }: UseDropdownOptions = {}) {
    const [isOpen, setIsOpen] = useState(false);

    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);
    const open = useCallback(() => setIsOpen(true), []);

    const ref = useClickOutside<T>({
        onClickOutside: close,
        enabled: isOpen
    });

    const select = useCallback((value: string) => {
        onSelect?.(value);
        close();
    }, [onSelect, close]);

    return {
        isOpen,
        open,
        close,
        toggle,
        select,
        ref
    };
}
