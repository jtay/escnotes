import { Button } from "@/components/ui/button";
import { FileText, Github, GithubIcon, LucideGithub, Plus, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { useAutosave } from "@/providers/autosave-provider";
import { useEffect } from "react";
import { openUrl } from '@tauri-apps/plugin-opener';

export function Home() {
  const { setShouldShowAutosave } = useAutosave();

  useEffect(() => {
    // Hide autosave state for home page
    setShouldShowAutosave(false);
  }, [setShouldShowAutosave]);

  const isMorning = new Date().getHours() < 12;
  const isAfternoon = new Date().getHours() < 19;

  return (
    <div className="flex items-center justify-center h-full p-8 overflow-y-auto">
      <div className="max-w-2xl text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{isMorning ? "Good Morning" : isAfternoon ? "Good Afternoon" : "Good Evening"}</h1>
          <p className="text-lg text-muted-foreground">
            Take notes and instantly print them using the power of ESC/POS
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
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

        <div className="bg-muted/50 rounded-lg p-4 text-left flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-md font-semibold mb-1">Improve EscNotes</h2>
            <p className="text-sm text-muted-foreground mb-2 max-w-sm">
              You can contribute to EscNotes by reporting issues, suggesting features, or even contributing code. <br /> <br />
              It's a super simple project to get started with, and any new features are greatly welcomed.
            </p>
          </div>
          <Button
            variant="outline"
            leftIcon={<LucideGithub className="h-3 w-3" />}
            onClick={() => openUrl("https://github.com/jtay/escnotes")}
          >
              View on GitHub
          </Button>
        </div>
      </div>
    </div>
  );
} 