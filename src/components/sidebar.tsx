import { useState, useEffect, useCallback } from "react";
import { Plus, Settings, Search, ArrowUp, ArrowDown, SortAsc, Clock, FileText, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "@/hooks/use-store";
import type { Note, SidebarFilterSettings } from "@/types/note";

type SortField = "lastModified" | "title" | "size";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getNotes, isLoading, refreshTrigger, getSidebarFilterSettings, saveSidebarFilterSettings } = useStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [sortField, setSortField] = useState<SortField>("lastModified");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadNotes = useCallback(async () => {
    const allNotes = await getNotes();
    setNotes(allNotes);
  }, [getNotes]);

  // Load persisted filter settings on component mount
  useEffect(() => {
    const loadFilterSettings = async () => {
      if (!isLoading && isInitialLoad) {
        try {
          const settings = await getSidebarFilterSettings();
          setSearchTerm(settings.searchTerm);
          setSortOrder(settings.sortOrder);
          setSortField(settings.sortField);
        } catch (error) {
          console.error("Failed to load sidebar filter settings:", error);
        } finally {
          setIsInitialLoad(false);
        }
      }
    };
    
    loadFilterSettings();
  }, [isLoading, isInitialLoad]);

  // Save filter settings whenever they change (but not during initial load)
  useEffect(() => {
    if (!isLoading && !isInitialLoad) {
      const saveFilterSettings = async () => {
        try {
          const settings: SidebarFilterSettings = {
            searchTerm,
            sortOrder,
            sortField
          };
          await saveSidebarFilterSettings(settings);
        } catch (error) {
          console.error("Failed to save sidebar filter settings:", error);
        }
      };
      
      saveFilterSettings();
    }
  }, [searchTerm, sortOrder, sortField, isLoading, isInitialLoad]);

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

  const filteredNotes = notes
    .filter(note =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "lastModified":
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          comparison = dateB - dateA;
          break;
        case "title":
          comparison = (a.title || "Untitled").localeCompare(b.title || "Untitled");
          break;
        case "size":
          const sizeA = a.content.length;
          const sizeB = b.content.length;
          comparison = sizeB - sizeA;
          break;
      }
      
      return sortOrder === "desc" ? comparison : -comparison;
    });

  const isActive = (noteId: string) => {
    return location.pathname === `/notes/${noteId}` || 
           location.pathname === `/notes/${noteId}/print`;
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "desc" ? "asc" : "desc");
  };

  const getSortIcon = () => {
    switch (sortField) {
      case "lastModified":
        return <Clock className="h-4 w-4" />;
      case "title":
        return <FileText className="h-4 w-4" />;
      case "size":
        return <HardDrive className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="px-2 gap-1"
                >
                  {getSortIcon()}
                  {sortOrder === "desc" ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUp className="h-3 w-3" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSortField("lastModified"); }}>
                  <Clock className="h-4 w-4 mr-2" />
                  Last Modified
                  {sortField === "lastModified" && (
                    <div className="ml-auto">
                      {sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                    </div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSortField("title"); }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Title
                  {sortField === "title" && (
                    <div className="ml-auto">
                      {sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                    </div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSortField("size"); }}>
                  <HardDrive className="h-4 w-4 mr-2" />
                  Size
                  {sortField === "size" && (
                    <div className="ml-auto">
                      {sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                    </div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); toggleSortOrder(); }}>
                  <SortAsc className="h-4 w-4 mr-2" />
                  Toggle Order ({sortOrder === "desc" ? "Desc" : "Asc"})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="default"
              onClick={() => navigate("/notes/new")}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              New
            </Button>
          </div>
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
                      {note.content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').substring(0, 60)}
                      {note.content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').length > 60 && "..."}
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