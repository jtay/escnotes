import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Eye, EyeOff, AlertCircle, X, ChevronDown, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "@/hooks/use-store";
import { useAutosave } from "@/providers/autosave-provider";
import { PreviewPane } from "@/components/notes/preview-pane";
import { MarkupTips } from "@/components/notes/markup-tips";
import { invoke } from "@tauri-apps/api/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note } from "@/types/note";

export function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getNote, saveNote, deleteNote, getPrinterSettings, isLoading: storeLoading } = useStore();
  
  const [note, setNote] = useState<Note>({
    id: "",
    title: "",
    content: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [paperWidth, setPaperWidth] = useState(48);
  const [printerSettings, setPrinterSettings] = useState<any>(null);
  const [printError, setPrintError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNewNote = useRef(false);
  const hasBeenSavedOnce = useRef(false);
  const isInitialLoad = useRef(true);
  const originalNoteRef = useRef<Note | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldRestoreFocusRef = useRef(false);
  const cursorPositionRef = useRef<number>(0);
  
  // Global autosave state
  const { startSaving, finishSaving, setLastSaved, setHasUnsavedChanges, setShouldShowAutosave } = useAutosave();

  // Handle title field navigation
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      contentTextareaRef.current?.focus();
    }
  };

  // Handle delete button click
  const handleDeleteClick = () => {
    if (!note.id || note.id === "new") return;
    
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      // Auto-reset after 3 seconds
      deleteTimeoutRef.current = setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 3000);
    } else {
      // Second click - actually delete
      handleDeleteNote();
    }
  };

  // Handle actual note deletion
  const handleDeleteNote = async () => {
    if (!note.id || note.id === "new") return;
    
    try {
      await deleteNote(note.id);
      console.log("Note deleted successfully");
      navigate("/"); // Navigate back to home after deletion
    } catch (error) {
      console.error("Failed to delete note:", error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Simple save function
  const saveNoteToStore = async (noteToSave: Note) => {
    startSaving();
    try {
      const savedDate = new Date();
      const updatedNote = {
        ...noteToSave,
        updatedAt: savedDate.toISOString()
      };
      await saveNote(updatedNote);
      setLastSaved(savedDate);
      
      // Update the original note reference to reflect the saved state
      originalNoteRef.current = { ...updatedNote };
      
      // If this was a new note that just got saved for the first time, navigate to the saved note
      if (isNewNote.current && !hasBeenSavedOnce.current) {
        hasBeenSavedOnce.current = true;
        // Check if content textarea currently has focus and capture cursor position
        shouldRestoreFocusRef.current = document.activeElement === contentTextareaRef.current;
        if (shouldRestoreFocusRef.current && contentTextareaRef.current) {
          cursorPositionRef.current = contentTextareaRef.current.selectionStart;
        }
        // Navigate to the saved note to update the URL and trigger sidebar refresh
        navigate(`/notes/${noteToSave.id}`, { replace: true });
        // Mark as no longer a new note after navigation
        isNewNote.current = false;
      }
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      finishSaving();
    }
  };

  // Simple delete function
  const deleteNoteFromStore = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      console.log("Note deleted successfully");
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  // Load printer settings for paper width
  useEffect(() => {
    const loadPrinterSettings = async () => {
      try {
        const settings = await getPrinterSettings();
        setPaperWidth(settings.printerWidth);
        setPrinterSettings(settings);
      } catch (error) {
        console.error("Failed to load printer settings:", error);
      }
    };

    if (!storeLoading) {
      loadPrinterSettings();
    }
  }, [getPrinterSettings, storeLoading]);

  // Initialize note and autosave state
  useEffect(() => {
    // Show autosave state for note editor immediately
    setShouldShowAutosave(true);
    
    if (id && id !== "new" && !storeLoading) {
      loadNote();
      isNewNote.current = false;
      hasBeenSavedOnce.current = true;
    } else if (id === "new" || !id) {
      // Create new note
      const newNote = {
        id: crypto.randomUUID(),
        title: "",
        content: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setNote(newNote);
      originalNoteRef.current = null; // No original state for new notes
      isNewNote.current = true;
      hasBeenSavedOnce.current = false;
      // Mark initial load as complete for new notes
      isInitialLoad.current = false;
      // Set initial state for new notes - show "Not saved yet"
      setLastSaved(null);
      setHasUnsavedChanges(false);
    }
  }, [id, storeLoading, setShouldShowAutosave, setLastSaved, setHasUnsavedChanges]);

  // Ensure autosave is always visible for note editor
  useEffect(() => {
    setShouldShowAutosave(true);
  }, [setShouldShowAutosave]);

  // Restore focus after URL navigation for new notes
  useEffect(() => {
    if (shouldRestoreFocusRef.current && contentTextareaRef.current) {
      // Use a small delay to ensure the component has re-rendered
      const timeoutId = setTimeout(() => {
        const textarea = contentTextareaRef.current;
        if (textarea) {
          textarea.focus();
          // Restore cursor position
          textarea.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
          shouldRestoreFocusRef.current = false;
        }
      }, 10);
      
      return () => clearTimeout(timeoutId);
    }
  }, [id]); // Trigger when the id changes (which happens after navigation)

  // Debounced save effect
  useEffect(() => {
    if (storeLoading) return;

    // Skip autosave during initial load
    if (isInitialLoad.current) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Check if there are actual changes compared to original note
    const hasActualChanges = originalNoteRef.current ? (
      note.title !== originalNoteRef.current.title || 
      note.content !== originalNoteRef.current.content
    ) : false;

    // Set unsaved changes state
    setHasUnsavedChanges(hasActualChanges);

    // For new notes: save immediately when there's both title and content
    if (isNewNote.current && note.title.trim() && note.content.trim()) {
      saveNoteToStore(note);
      return;
    }

    // For existing notes: only save if there are actual changes
    if (!isNewNote.current && note.id && note.id !== "new" && hasActualChanges) {
      // Check if note is completely empty (should be deleted)
      if (!note.title.trim() && !note.content.trim()) {
        saveTimeoutRef.current = setTimeout(() => {
          deleteNoteFromStore(note.id);
        }, 1000);
        return;
      }

      // Save changes after 1 second of no typing
      saveTimeoutRef.current = setTimeout(() => {
        saveNoteToStore(note);
      }, 1000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [note.title, note.content, storeLoading, setHasUnsavedChanges]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  const loadNote = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const loadedNote = await getNote(id);
      if (loadedNote) {
        setNote(loadedNote);
        // Store the original note for change detection
        originalNoteRef.current = { ...loadedNote };
        // Set last saved time from note's updatedAt field
        setLastSaved(new Date(loadedNote.updatedAt));
        setHasUnsavedChanges(false); // Reset unsaved changes for loaded note
      } else {
        // Note not found, reset autosave state
        originalNoteRef.current = null;
        setLastSaved(null);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Failed to load note:", error);
      // On error, reset autosave state
      originalNoteRef.current = null;
      setLastSaved(null);
      setHasUnsavedChanges(false);
    } finally {
      setIsLoading(false);
      // Mark initial load as complete after loading
      isInitialLoad.current = false;
    }
  };

  const handlePrint = async (printerName?: string) => {
    if (!note.id || note.id === "new") {
      return;
    }

    const targetPrinter = printerName || printerSettings?.defaultPrinter;
    if (!targetPrinter) {
      setPrintError("No printer selected. Please configure a printer in Settings.");
      return;
    }

    // Check if note is empty
    if (!note.title.trim() && !note.content.trim()) {
      setPrintError("Cannot print empty note. Please add some content first.");
      return;
    }

    setIsPrinting(true);
    setPrintError(null);

    try {
      await invoke("print_note", {
        note: {
          title: note.title,
          content: note.content,
          created_at: note.createdAt
        },
        printerName: targetPrinter,
        printerWidth: printerSettings?.printerWidth || 48
      });
      console.log("Note printed successfully!");
    } catch (error) {
      console.error("Failed to print:", error);
      setPrintError("Failed to print note. Please check your printer settings and try again.");
    } finally {
      setIsPrinting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative">
      {/* Print Error Alert */}
      {printError && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-destructive/10 border-b border-destructive/20 p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium">Print Error</p>
              <p className="text-sm text-destructive/80 mt-1">{printError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPrintError(null)}
              className="text-destructive hover:text-destructive/80"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Top Toolbar */}
      <div className={`absolute top-0 left-0 right-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${printError ? 'top-20' : ''}`}>
        <div className="flex items-center justify-between px-6 py-3">
          {/* Title Input */}
          <div className="flex-1 max-w-2xl">
            <input
              ref={titleInputRef}
              type="text"
              value={note.title}
              onChange={(e) => setNote({ ...note, title: e.target.value })}
              onKeyDown={handleTitleKeyDown}
              placeholder="Untitled Note"
              className="w-full bg-transparent text-xl font-semibold border-none outline-none placeholder:text-muted-foreground border-b border-border focus:border-b-2 focus:border-primary transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant={showDeleteConfirm ? "destructive" : "outline"}
              size="sm"
              onClick={handleDeleteClick}
              disabled={!note.id || note.id === "new"}
              className={showDeleteConfirm ? "animate-pulse" : "border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20"}
            >
              <Trash2 className="h-4 w-4" />
              {showDeleteConfirm && <span className="ml-2">Click again to confirm</span>}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Preview
                </>
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    !note.id || 
                    note.id === "new" || 
                    !printerSettings?.defaultPrinter || 
                    isPrinting ||
                    (!note.title.trim() && !note.content.trim())
                  }
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {isPrinting ? "Printing..." : "Print"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => handlePrint()}
                  disabled={isPrinting}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print to Default ({printerSettings?.defaultPrinter || "None"})
                </DropdownMenuItem>
                {printerSettings?.availablePrinters?.map((printer: string) => (
                  printer !== printerSettings.defaultPrinter && (
                    <DropdownMenuItem 
                      key={printer}
                      onClick={() => handlePrint(printer)}
                      disabled={isPrinting}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print to {printer}
                    </DropdownMenuItem>
                  )
                ))}
                {(!printerSettings?.availablePrinters || printerSettings.availablePrinters.length === 0) && (
                  <DropdownMenuItem disabled>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    No printers available
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`absolute top-0 left-0 right-0 bottom-0 ${printError ? 'top-20' : ''}`} style={{ top: printError ? '80px' : '60px' }}>
        <div className="h-full flex">
          {/* Editor */}
          <div className={`flex-1 flex flex-col ${showPreview ? 'border-r border-border' : ''}`}>
            <textarea
              ref={contentTextareaRef}
              value={note.content}
              onChange={(e) => setNote({ ...note, content: e.target.value })}
              placeholder="Start writing your note... (Custom markup supported)"
              className="flex-1 w-full p-6 bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed placeholder:text-muted-foreground overflow-y-auto"
              style={{ paddingBottom: '120px' }} // Add padding to prevent content from being hidden behind markup tips
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="w-1/2 flex-shrink-0 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <PreviewPane note={note} paperWidth={paperWidth} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Markup Tips - Fixed at bottom of note editor area */}
      <div className="fixed bottom-0 z-30" style={{ left: '320px', right: '0px' }}>
        <MarkupTips />
      </div>
    </div>
  );
} 