import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/hooks/use-store";
import { useAutosave } from "@/providers/autosave-provider";
import { invoke } from "@tauri-apps/api/core";
import type { PrinterSettings } from "@/types/note";

export function Settings() {
  const navigate = useNavigate();
  const { getPrinterSettings, savePrinterSettings, isLoading: storeLoading } = useStore();
  const { startSaving, finishSaving, setLastSaved, setHasUnsavedChanges, setShouldShowAutosave } = useAutosave();
  
  const [settings, setSettings] = useState<PrinterSettings>({
    defaultPrinter: "",
    printerWidth: 48,
    availablePrinters: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Show autosave state for settings page
    setShouldShowAutosave(true);
    
    if (!storeLoading) {
      loadSettings();
    }
  }, [storeLoading, setShouldShowAutosave]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const savedSettings = await getPrinterSettings();
      console.log("Loaded settings:", savedSettings);
      setSettings(savedSettings);
      setHasUnsavedChanges(false); // Reset unsaved changes when loading
      
      // Set last saved time from settings if available
      if (savedSettings.lastSaved) {
        setLastSaved(new Date(savedSettings.lastSaved));
      } else {
        // If no last saved time, show "Not saved yet"
        setLastSaved(null);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPrinters = async () => {
    setIsLoading(true);
    try {
      // This will be implemented in the Rust backend
      const printers = await invoke("get_available_printers");
      const updatedSettings = {
        ...settings,
        availablePrinters: printers as string[],
        lastSaved: new Date().toISOString()
      };
      setSettings(updatedSettings);
      // Save the updated settings immediately
      startSaving();
      try {
        await savePrinterSettings(updatedSettings);
        setLastSaved(new Date());
      } finally {
        finishSaving();
      }
    } catch (error) {
      console.error("Failed to refresh printers:", error);
      alert("Failed to refresh printer list");
    } finally {
      setIsLoading(false);
    }
  };



  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="space-y-8">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Printer Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Available Printers
                </label>
                <div className="flex space-x-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshPrinters}
                    disabled={isLoading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Printers
                  </Button>
                </div>
                {settings.availablePrinters.length > 0 ? (
                  <div className="space-y-2">
                    {settings.availablePrinters.map((printer, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-2 border rounded"
                      >
                        <input
                          type="radio"
                          id={`printer-${index}`}
                          name="defaultPrinter"
                          value={printer}
                          checked={settings.defaultPrinter === printer}
                          onChange={async (e) => {
                            const updatedSettings = {
                              ...settings,
                              defaultPrinter: e.target.value,
                              lastSaved: new Date().toISOString()
                            };
                            setSettings(updatedSettings);
                            setHasUnsavedChanges(true);
                            startSaving();
                            try {
                              await savePrinterSettings(updatedSettings);
                              setLastSaved(new Date());
                            } catch (error) {
                              console.error("Failed to save printer selection:", error);
                            } finally {
                              finishSaving();
                            }
                          }}
                        />
                        <label htmlFor={`printer-${index}`} className="text-sm">
                          {printer}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No printers found. Click "Refresh Printers" to scan for available printers.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="printerWidth" className="block text-sm font-medium mb-2">
                  Printer Width (characters)
                </label>
                <input
                  id="printerWidth"
                  type="number"
                  min="32"
                  max="80"
                  value={settings.printerWidth}
                  onChange={async (e) => {
                    const updatedSettings = {
                      ...settings,
                      printerWidth: parseInt(e.target.value) || 48,
                      lastSaved: new Date().toISOString()
                    };
                    setSettings(updatedSettings);
                    setHasUnsavedChanges(true);
                    startSaving();
                    try {
                      await savePrinterSettings(updatedSettings);
                      setLastSaved(new Date());
                    } catch (error) {
                      console.error("Failed to save printer width:", error);
                    } finally {
                      finishSaving();
                    }
                  }}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Standard thermal printers are typically 48 characters wide
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 