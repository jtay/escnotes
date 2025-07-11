export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrinterSettings {
  defaultPrinter: string;
  printerWidth: number;
  availablePrinters: string[];
  lastSaved?: string; // ISO string of when settings were last saved
}

export interface SidebarFilterSettings {
  searchTerm: string;
  sortOrder: "desc" | "asc";
  sortField: "lastModified" | "title" | "size";
} 