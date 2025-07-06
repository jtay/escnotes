import { useState, useEffect } from "react";
import { load } from "@tauri-apps/plugin-store";
import type { Note, PrinterSettings } from "@/types/note";

export function useStore() {
  const [isLoading, setIsLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Initialize store
    const initStore = async () => {
      try {
        console.log("Initializing store...");
        const storeInstance = await load('.settings.dat', { autoSave: false });
        console.log("Store initialized:", storeInstance);
        setStore(storeInstance);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize store:", error);
        setIsLoading(false);
      }
    };
    
    initStore();
  }, []);

  const getNotes = async (): Promise<Note[]> => {
    if (!store) return [];
    try {
      const notes = await store.get('notes');
      console.log("Retrieved notes:", notes);
      return notes || [];
    } catch (error) {
      console.error("Failed to get notes:", error);
      return [];
    }
  };

  const saveNote = async (note: Note): Promise<void> => {
    if (!store) throw new Error("Store not initialized");
    try {
      const notes = await getNotes();
      const existingIndex = notes.findIndex(n => n.id === note.id);
      
      if (existingIndex >= 0) {
        notes[existingIndex] = note;
      } else {
        notes.push(note);
      }
      
      console.log("Saving notes:", notes);
      await store.set('notes', notes);
      await store.save();
      console.log("Notes saved successfully");
      
      // Trigger refresh for all components using the store
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to save note:", error);
      throw error;
    }
  };

  const deleteNote = async (id: string): Promise<void> => {
    if (!store) throw new Error("Store not initialized");
    try {
      const notes = await getNotes();
      const filteredNotes = notes.filter(note => note.id !== id);
      await store.set('notes', filteredNotes);
      await store.save();
      
      // Trigger refresh for all components using the store
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to delete note:", error);
      throw error;
    }
  };

  const getNote = async (id: string): Promise<Note | null> => {
    if (!store) return null;
    try {
      const notes = await getNotes();
      return notes.find(note => note.id === id) || null;
    } catch (error) {
      console.error("Failed to get note:", error);
      return null;
    }
  };

  const getPrinterSettings = async (): Promise<PrinterSettings> => {
    if (!store) {
      return {
        defaultPrinter: "",
        printerWidth: 48,
        availablePrinters: []
      };
    }
    try {
      return (await store.get('printerSettings')) || {
        defaultPrinter: "",
        printerWidth: 48,
        availablePrinters: []
      };
    } catch (error) {
      console.error("Failed to get printer settings:", error);
      return {
        defaultPrinter: "",
        printerWidth: 48,
        availablePrinters: []
      };
    }
  };

  const savePrinterSettings = async (settings: PrinterSettings): Promise<void> => {
    if (!store) throw new Error("Store not initialized");
    try {
      await store.set('printerSettings', settings);
      await store.save();
    } catch (error) {
      console.error("Failed to save printer settings:", error);
      throw error;
    }
  };

  return {
    isLoading,
    getNotes,
    saveNote,
    deleteNote,
    getNote,
    getPrinterSettings,
    savePrinterSettings,
    refreshTrigger
  };
} 