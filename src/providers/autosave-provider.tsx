import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AutosaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveProgress: number; // 0-100 for progress indicator
  shouldShowAutosave: boolean; // Whether to show autosave state in navigation
}

interface AutosaveContextType {
  autosaveState: AutosaveState;
  startSaving: () => void;
  finishSaving: () => void;
  setLastSaved: (date: Date | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  resetAutosaveState: () => void;
  setShouldShowAutosave: (shouldShow: boolean) => void;
}

const AutosaveContext = createContext<AutosaveContextType | undefined>(undefined);

const initialAutosaveState: AutosaveState = {
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  saveProgress: 0,
  shouldShowAutosave: false,
};

export function AutosaveProvider({ children }: { children: ReactNode }) {
  const [autosaveState, setAutosaveState] = useState<AutosaveState>(initialAutosaveState);

  const startSaving = useCallback(() => {
    setAutosaveState(prev => ({
      ...prev,
      isSaving: true,
      saveProgress: 0,
    }));
  }, []);

  const finishSaving = useCallback(() => {
    setAutosaveState(prev => ({
      ...prev,
      isSaving: false,
      saveProgress: 100,
      hasUnsavedChanges: false,
    }));
  }, []);

  const setLastSaved = useCallback((date: Date | null) => {
    setAutosaveState(prev => ({
      ...prev,
      lastSaved: date,
    }));
  }, []);

  const setHasUnsavedChanges = useCallback((hasChanges: boolean) => {
    setAutosaveState(prev => ({
      ...prev,
      hasUnsavedChanges: hasChanges,
    }));
  }, []);

  const setShouldShowAutosave = useCallback((shouldShow: boolean) => {
    setAutosaveState(prev => ({
      ...prev,
      shouldShowAutosave: shouldShow,
    }));
  }, []);

  const resetAutosaveState = useCallback(() => {
    setAutosaveState(initialAutosaveState);
  }, []);

  const value: AutosaveContextType = {
    autosaveState,
    startSaving,
    finishSaving,
    setLastSaved,
    setHasUnsavedChanges,
    resetAutosaveState,
    setShouldShowAutosave,
  };

  return (
    <AutosaveContext.Provider value={value}>
      {children}
    </AutosaveContext.Provider>
  );
}

export function useAutosave() {
  const context = useContext(AutosaveContext);
  if (context === undefined) {
    throw new Error('useAutosave must be used within an AutosaveProvider');
  }
  return context;
} 