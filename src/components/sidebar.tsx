import { useState, useEffect, useCallback } from "react";
import { Plus, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "@/hooks/use-store";
import type { Note } from "@/types/note";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getNotes, isLoading, refreshTrigger } = useStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const loadNotes = useCallback(async () => {
    const allNotes = await getNotes();
    setNotes(allNotes);
  }, [getNotes]);

  useEffect(() => {
    if (!isLoading) {
      loadNotes();
    }
  }, [isLoading, loadNotes]);

  // Refresh notes when navigating to different routes or when notes are saved
  useEffect(() => {
    if (!isLoading) {
      loadNotes();
    }
  }, [location.pathname, isLoading, refreshTrigger, loadNotes]);

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isActive = (noteId: string) => {
    return location.pathname === `/notes/${noteId}` || 
           location.pathname === `/notes/${noteId}/print`;
  };

  return (
    <div className="w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Button
            size="sm"
            variant="default"
            onClick={() => navigate("/notes/new")}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New
          </Button>
        </div>
        
        {/* Search */}
        <Input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Notes List - Scrollable within available space */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm ? "No notes found" : "No notes yet"}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  isActive(note.id)
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-muted"
                }`}
                onClick={() => navigate(`/notes/${note.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${
                      isActive(note.id) ? "text-primary" : ""
                    }`}>
                      {note.title || "Untitled"}
                    </h3>
                    <p className={`text-xs truncate mt-1 ${
                      isActive(note.id) ? "text-primary/70" : "text-muted-foreground"
                    }`}>
                      {note.content.substring(0, 60)}
                      {note.content.length > 60 && "..."}
                    </p>
                    <p className={`text-xs mt-1 ${
                      isActive(note.id) ? "text-primary/60" : "text-muted-foreground"
                    }`}>
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Fixed */}
      <div className="flex-shrink-0 shadow-[0_-2px_4px_-1px_rgba(0,0,0,0.05)]">
        <Link to="/settings">
          <Button 
            variant="ghost" 
            size="lg"
            rounded="none"
            className="w-full justify-start"
            leftIcon={<Settings className="h-4 w-4" />}
          >
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
} 