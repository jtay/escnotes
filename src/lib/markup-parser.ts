// ESC/POS Commands - Browser compatible
const COMMANDS = {
  INIT: '\x1B\x40',
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  DOUBLE_HEIGHT: '\x1B\x21\x10',
  DOUBLE_WIDTH: '\x1B\x21\x20',
  DOUBLE_BOTH: '\x1B\x21\x30',
  NORMAL: '\x1B\x21\x00',
  CUT_PAPER: '\x1D\x56\x41\x00',
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_RIGHT: '\x1B\x61\x02',
  NEWLINE: '\n',
};

export interface MarkupOptions {
  paperWidth?: number;
  showCommands?: boolean;
  title?: string;
}

// Helper function to wrap text to paper width, splitting words if needed
export function wrapTextWithHtml(text: string, width: number): string {
  const lines = text.split('\n');
  const wrappedLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === '') {
      wrappedLines.push('');
      continue;
    }

    // Handle alignment tags specially
    if (line.includes('<center>') || line.includes('<right>') || line.includes('<left>')) {
      wrappedLines.push(line);
      continue;
    }

    // Remove HTML tags for wrapping calculation, but keep them in the output
    let visible = '';
    let tag = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '<') tag = true;
      if (!tag) visible += line[i];
      if (line[i] === '>') tag = false;
    }

    let idx = 0;
    let out = '';
    let visibleCount = 0;
    while (idx < line.length) {
      let char = line[idx];
      if (char === '<') {
        // Copy tag verbatim
        let tagEnd = line.indexOf('>', idx);
        if (tagEnd === -1) {
          out += line.slice(idx);
          break;
        }
        out += line.slice(idx, tagEnd + 1);
        idx = tagEnd + 1;
        continue;
      }
      out += char;
      visibleCount++;
      idx++;
      if (visibleCount === width) {
        // Trim leading spaces for all but the first line
        wrappedLines.push(out.replace(/^\s+/, ''));
        out = '';
        visibleCount = 0;
      }
    }
    if (out) wrappedLines.push(out.replace(/^\s+/, ''));
  }

  return wrappedLines.join('\n');
}

// Helper function to get the actual character length of text (ignoring HTML tags)
function getTextLength(text: string): number {
  return text.replace(/<[^>]*>/g, '').length;
}

export function parseMarkupToHtml(text: string, options: MarkupOptions = {}): string {
  const { paperWidth = 48 } = options;
  
  // First, wrap the text to the paper width
  const wrappedText = wrapTextWithHtml(text, paperWidth);
  
  return wrappedText
    .split('\n')
    .map(line => {
      // Process alignment tags
      let processedLine = line
        .replace(/<center>(.*?)<\/center>/g, (_match, content) => {
          // Centered monospace
          return `<div style="text-align:center; font-family:monospace;">${content}</div>`;
        })
        .replace(/<right>(.*?)<\/right>/g, (_match, content) => {
          // Right-aligned monospace
          return `<div style="text-align:right; font-family:monospace;">${content}</div>`;
        })
        .replace(/<left>(.*?)<\/left>/g, (_match, content) => {
          // Left-aligned monospace
          return `<div style="text-align:left; font-family:monospace;">${content}</div>`;
        });

      // Process formatting tags (always monospace)
      processedLine = processedLine
        .replace(/<bold><large>(.*?)<\/large><\/bold>/g, '<span style="font-size:1.5em; font-weight:bold; font-family:monospace; color:#000;">$1</span>')
        .replace(/<large>(.*?)<\/large>/g, '<span style="font-size:1.5em; font-family:monospace; color:#000;">$1</span>')
        .replace(/<bold>(.*?)<\/bold>/g, '<span style="font-weight:bold; font-family:monospace; color:#000;">$1</span>')
        .replace(/£/g, '£')
        // Cut: thick, dashed, grey line with margin
        .replace(/<cut>/g, '<div style="border-top:3px dashed #888; margin:18px 0 18px 0; height:0;"></div>')
        // Divider: thin, light line
        .replace(/<divider>/g, '<div style="border-top:1px solid #ccc; margin:8px 0 8px 0; height:0;"></div>');

      return processedLine;
    })
    .join('\n');
}

export function parseMarkupToEscPos(text: string, options: MarkupOptions = {}): string {
  const { title = "" } = options;
  
  let result = '';
  
  // ESC/POS initialization
  result += COMMANDS.INIT;
  
  // Add 3 line breaks at the top
  result += COMMANDS.NEWLINE.repeat(3);
  
  // Add title if provided
  if (title.trim()) {
    result += COMMANDS.DOUBLE_BOTH + title.trim() + COMMANDS.NORMAL + COMMANDS.NEWLINE;
  }
  
  // Add printed date/time
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  result += `Printed ${dateStr} at ${timeStr}` + COMMANDS.NEWLINE + COMMANDS.NEWLINE;
  
  const lines = text.split('\n');
  
  for (const line of lines) {
    let processedLine = line;
    
    // Process alignment tags
    processedLine = processedLine
      .replace(/<center>(.*?)<\/center>/g, (_match, content) => {
        return COMMANDS.ALIGN_CENTER + 
               content + 
               COMMANDS.ALIGN_LEFT;
      })
      .replace(/<right>(.*?)<\/right>/g, (_match, content) => {
        return COMMANDS.ALIGN_RIGHT + 
               content + 
               COMMANDS.ALIGN_LEFT;
      })
      .replace(/<left>(.*?)<\/left>/g, (_match, content) => {
        return COMMANDS.ALIGN_LEFT + 
               content;
      });

    // Process formatting tags
    processedLine = processedLine
      .replace(/<bold><large>/g, COMMANDS.BOLD_ON + COMMANDS.DOUBLE_BOTH)
      .replace(/<\/large><\/bold>/g, COMMANDS.NORMAL + COMMANDS.BOLD_OFF)
      .replace(/<large>/g, COMMANDS.DOUBLE_BOTH)
      .replace(/<\/large>/g, COMMANDS.NORMAL)
      .replace(/<bold>/g, COMMANDS.BOLD_ON)
      .replace(/<\/bold>/g, COMMANDS.BOLD_OFF)
      .replace(/£/g, '£') // Keep pound symbol as-is
      .replace(/<cut>/g, COMMANDS.CUT_PAPER)
      .replace(/<divider>/g, ''); // Remove dividers from print output

    result += processedLine + COMMANDS.NEWLINE;
  }
  
  // Add 3 line breaks at the bottom before cutting
  result += COMMANDS.NEWLINE.repeat(3);
  
  // Cut paper at the end
  result += COMMANDS.CUT_PAPER;
  
  return result;
}

export function getMarkupPreview(text: string, paperWidth: number = 48): string {
  return parseMarkupToHtml(text, { paperWidth });
}

export function getMarkupCommands(text: string, paperWidth: number = 48): string {
  return parseMarkupToEscPos(text, { paperWidth });
}

// Helper function to wrap text to paper width
export function wrapText(text: string, width: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join('\n');
} 