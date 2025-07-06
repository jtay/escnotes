import { Button } from "@/components/ui/button";
import { FileText, Plus, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { useAutosave } from "@/providers/autosave-provider";
import { useEffect } from "react";

export function Home() {
  const { setShouldShowAutosave } = useAutosave();

  useEffect(() => {
    // Hide autosave state for home page
    setShouldShowAutosave(false);
  }, [setShouldShowAutosave]);

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-2xl text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Welcome to EscNotes</h1>
          <p className="text-lg text-muted-foreground">
            Create, manage, and print your notes with ESC/POS support
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <Plus className="h-6 w-6 text-primary mr-2" />
              <h3 className="font-semibold">New Note</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Create a new note with markdown support
            </p>
            <Link to="/notes/new">
              <Button size="sm" className="w-full">
                Create
              </Button>
            </Link>
          </div>

          <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <FileText className="h-6 w-6 text-primary mr-2" />
              <h3 className="font-semibold">View Notes</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Browse your notes in the sidebar
            </p>
            <div className="text-xs text-muted-foreground">
              Select any note to edit
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <Printer className="h-6 w-6 text-primary mr-2" />
              <h3 className="font-semibold">Print</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Print notes to ESC/POS printers
            </p>
            <Link to="/settings">
              <Button size="sm" variant="outline" className="w-full">
                Settings
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">Quick Tips</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Use markdown syntax for rich text formatting</li>
            <li>• Notes are automatically saved as you type</li>
            <li>• Print notes directly to ESC/POS compatible printers</li>
            <li>• Configure your default printer in settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 