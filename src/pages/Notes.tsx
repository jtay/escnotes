import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Printer, Search, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "@/hooks/use-store";
import { useAutosave } from "@/providers/autosave-provider";
import type { Note } from "@/types/note";

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { getNotes, deleteNote, isLoading } = useStore();
  const { setShouldShowAutosave } = useAutosave();
  const navigate = useNavigate();

  useEffect(() => {
    // Hide autosave state for notes list page
    setShouldShowAutosave(false);
    
    if (!isLoading) {
      loadNotes();
    }
  }, [isLoading, setShouldShowAutosave]);

  const loadNotes = async () => {
    const allNotes = await getNotes();
    setNotes(allNotes);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNote(id);
      await loadNotes();
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Notes</h1>
          <Link to="/notes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No notes found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Create your first note to get started"}
            </p>
            {!searchTerm && (
              <Link to="/notes/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Note
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{note.title}</h3>
                    <p className="text-muted-foreground mb-2 line-clamp-2">
                      {note.content.substring(0, 200)}
                      {note.content.length > 200 && "..."}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last modified: {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/notes/${note.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/notes/${note.id}/print`)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 