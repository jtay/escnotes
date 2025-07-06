import { useState } from "react";
import { getMarkupPreview } from "@/lib/markup-parser";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface MarkupTip {
  code: string;
  description: string;
  example: string;
}

const MARKUP_TIPS: MarkupTip[] = [
  {
    code: "<bold>text</bold>",
    description: "Bold text",
    example: "<bold>Bold text</bold>"
  },
  {
    code: "<large>text</large>",
    description: "Large text",
    example: "<large>Large text</large>"
  },
  {
    code: "<center>text</center>",
    description: "Centered text",
    example: "<center>Centered text</center>"
  },
  {
    code: "<right>text</right>",
    description: "Right-aligned text",
    example: "<right>Right-aligned text</right>"
  },
  {
    code: "<divider>",
    description: "Line of dashes",
    example: "------ (repeated to fill line)"
  },
  {
    code: "<cut>",
    description: "Cut line",
    example: "*cuts paper*"
  }
];

export function MarkupTips() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-background border-t border-border shadow-[0_-2px_4px_-1px_rgba(0,0,0,0.05)]">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 h-11 flex items-center justify-between text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
      >
        <div className="flex items-center space-x-2">
          <HelpCircle className="h-4 w-4" />
          <span className="font-medium">Markup Tips</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 transition-all ease-in-out duration-300">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {MARKUP_TIPS.map((tip, index) => (
              <div
                key={index}
                className="bg-background border border-border rounded-lg overflow-hidden"
              >
                {/* Code Header */}
                <div className="px-3 py-2 bg-muted/50 border-b border-border">
                  <code className="text-xs font-mono text-foreground">
                    {tip.code}
                  </code>
                </div>
                
                {/* Print Preview */}
                <div className="p-3 bg-white">
                  <div 
                    className="text-xs font-mono leading-tight"
                    style={{ 
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      lineHeight: '1.2',
                      whiteSpace: 'pre-wrap',
                      color: '#000000',
                      backgroundColor: '#ffffff'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: getMarkupPreview(tip.example, 32) 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 