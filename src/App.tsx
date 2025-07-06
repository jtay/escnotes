import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { Navigation } from "./components/navigation";
import { Sidebar } from "./components/sidebar";
import { ThemeProvider } from "./components/theme-provider";
import { AutosaveProvider } from "./providers/autosave-provider";
import { Home } from "./pages/Home";

import { NoteEditor } from "./pages/NoteEditor";
import { Settings } from "./pages/Settings";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="escnotes-theme">
      <AutosaveProvider>
        <Router>
          <div className="h-screen bg-background flex flex-col">
            <Navigation />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/notes" element={<Navigate to="/" replace />} />
                  <Route path="/notes/new" element={<NoteEditor />} />
                  <Route path="/notes/:id" element={<NoteEditor />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </AutosaveProvider>
    </ThemeProvider>
  );
}

export default App;
