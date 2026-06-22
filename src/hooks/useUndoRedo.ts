import { useState, useCallback, useRef } from 'react';

export function useUndoRedo<T>(initialState: T, options: { debounceMs?: number } = {}) {
  const { debounceMs = 500 } = options;
  const [state, setState] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedState = useRef<T>(initialState);

  const setWithUndo = useCallback((newState: T | ((prev: T) => T)) => {
    setState((prev) => {
      const updated = typeof newState === 'function' ? (newState as any)(prev) : newState;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (JSON.stringify(lastSavedState.current) !== JSON.stringify(updated)) {
          setPast((p) => [...p, lastSavedState.current]);
          lastSavedState.current = updated;
          setFuture([]);
        }
      }, debounceMs);
      
      return updated;
    });
  }, [debounceMs]);

  const undo = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If there are unsaved changes, undo reverts to the last saved state
    if (JSON.stringify(lastSavedState.current) !== JSON.stringify(state)) {
      setFuture((f) => [state, ...f]);
      setState(lastSavedState.current);
      return;
    }

    // Otherwise, pop from past
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, p.length - 1));
    setFuture((f) => [state, ...f]);
    setState(previous);
    lastSavedState.current = previous;
  }, [state, past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const next = future[0];
    setFuture((f) => f.slice(1));
    
    setPast((p) => [...p, state]);
    setState(next);
    lastSavedState.current = next;
  }, [state, future]);

  // We also need a way to completely reset the state (e.g. when loading a resume)
  const resetState = useCallback((newState: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState(newState);
    setPast([]);
    setFuture([]);
    lastSavedState.current = newState;
  }, []);

  const canUndo = past.length > 0 || JSON.stringify(lastSavedState.current) !== JSON.stringify(state);
  const canRedo = future.length > 0;

  return [state, setWithUndo, undo, redo, canUndo, canRedo, resetState] as const;
}
