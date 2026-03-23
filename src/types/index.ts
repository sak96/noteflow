export interface Note {
  id: string;
  name: string;
  category: string;
  content: string | null;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export function isDivider(item: Note): boolean {
  return item.content === null;
}

export interface NoteUpdate {
  name?: string;
  category?: string;
  content?: string;
  order?: number;
}

export interface SearchResult {
  id: string;
  name: string;
  score: number;
}

export interface RouterParams {
  id?: string;
}

export interface RouteComponent {
  name: string;
  params?: RouterParams;
}
