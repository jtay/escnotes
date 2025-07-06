import { ThemeToggle } from "@/components/theme-toggle"
import { Link } from "react-router-dom"
import { useAutosave } from "@/providers/autosave-provider"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"

export function Navigation() {
  const { autosaveState } = useAutosave();
  const { isSaving, lastSaved, hasUnsavedChanges, shouldShowAutosave } = autosaveState;

  const getAutosaveStatus = () => {
    if (isSaving) {
      return (
        <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving...</span>
        </div>
      );
    }

    if (hasUnsavedChanges) {
      return (
        <div className="flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span>Unsaved changes</span>
        </div>
      );
    }

    if (lastSaved) {
      return (
        <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span>Saved {lastSaved.toLocaleTimeString()}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>Not saved yet</span>
      </div>
    );
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
            EscNotes
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {shouldShowAutosave && getAutosaveStatus()}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
} 