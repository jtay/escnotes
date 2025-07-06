import { useMemo } from "react";
import { getMarkupPreview } from "@/lib/markup-parser";
import type { Note } from "@/types/note";

interface PreviewPaneProps {
  note: Note;
  paperWidth: number;
  className?: string;
}

export function PreviewPane({ note, paperWidth, className }: PreviewPaneProps) {
  const previewContent = useMemo(() => {
    let content = "";
    
    // Add title and printed date/time as part of the content string, so they are processed by the markup parser
    if (note.title.trim()) {
      content += `<bold><large>${note.title}</large></bold>\n`;
    }
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB');
    const timeStr = now.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    content += `Printed ${dateStr} at ${timeStr}\n\n`;
    if (note.content) {
      content += note.content;
    }
    // Now pass the whole string through getMarkupPreview
    return getMarkupPreview(content, paperWidth);
  }, [note.title, note.content, paperWidth]);

  // Calculate the width based on character count and font size
  // Using 12px monospace font, each character is approximately 7.2px wide
  const charWidth = 7.2; // pixels per character in 12px monospace
  const previewWidth = paperWidth * charWidth + 52; // 48px for padding (24px each side)

  return (
    <div className={`flex flex-col h-full bg-background ${className}`} style={{ width: `${previewWidth}px`, minWidth: `${previewWidth}px` }}>
      {/* Preview header */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-medium">Print Preview</span>
          <span className="font-mono text-xs">{paperWidth} chars wide</span>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-auto">
        <div 
          className="p-6 font-mono text-sm leading-relaxed bg-background"
          style={{ 
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'hsl(var(--foreground))',
            backgroundColor: 'hsl(var(--background))',
            width: '100%',
            maxWidth: '100%'
          }}
        >
          {/* Content */}
          <div 
            dangerouslySetInnerHTML={{ __html: previewContent }}
            className="whitespace-pre-wrap"
            style={{
              color: 'hsl(var(--foreground))',
              backgroundColor: 'hsl(var(--background))',
              width: '100%',
              maxWidth: '100%'
            }}
          />
        </div>
      </div>
    </div>
  );
} 