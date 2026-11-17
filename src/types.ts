export type NotebookKey = 'species' | 'bioglow' | 'carbon' | 'journal';

export type TemplateKey =
  | 'plant'
  | 'animal'
  | 'bioglow'
  | 'carbon'
  | 'quick'
  | 'general';

export type FieldType =
  | 'text'
  | 'multiline'
  | 'chips'
  | 'glowColour'
  | 'brightness';

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
}

export interface TemplateDef {
  key: TemplateKey;
  title: string;
  icon: string;
  tagline: string;
  defaultNotebook: NotebookKey;
  gradient: [string, string];
  fields: TemplateField[];
}

export interface NotebookDef {
  key: NotebookKey;
  title: string;
  icon: string;
  tagline: string;
  gradient: [string, string];
}

export interface FieldEntry {
  schemaVersion: 3;
  id: string;
  templateKey: TemplateKey;
  notebookKey: NotebookKey;
  title: string;
  /** Guided template answers, keyed by TemplateField.key */
  values: Record<string, string>;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  /** Horizontal GPS uncertainty reported by the device, in metres. */
  horizontalAccuracy: number | null;
  locationLabel: string;
  /** Stable managed-media reference, temporary picker URI while editing, or null. */
  photoUri: string | null;
  /** Stable managed-media reference, temporary recorder URI while editing, or null. */
  voiceUri: string | null;
  starred: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type TabKey = 'home' | 'notebook' | 'ideas';
