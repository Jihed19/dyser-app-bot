export type StudioFormat = 'pdf' | 'slides' | 'images';
export type StudioMode = 'ai' | 'manual';

export interface VisualElement {
  id: string;
  type: 'heading' | 'subheading' | 'text' | 'badge' | 'box' | 'line' | 'icon' | 'image' | 'formula';
  content: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width?: number; // percentage
  height?: number; // percentage or px
  fontSize?: number; // px
  fontWeight?: 'normal' | 'medium' | 'bold' | 'black';
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textAlign?: 'left' | 'center' | 'right';
  zIndex: number;
  rotation?: number;
  opacity?: number;
}

export interface StudioPage {
  id: string;
  pageNumber: number;
  title: string;
  subtitle?: string;
  backgroundColor: string;
  backgroundImage?: string;
  elements: VisualElement[];
  notes?: string;
}

export interface StudioDocument {
  id: string;
  format: StudioFormat;
  title: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  theme: {
    primary: string;
    accent: string;
    background: string;
    fontFamily: string;
  };
  pages: StudioPage[];
}

export interface StudioGalleryItem {
  id: string;
  title: string;
  format: StudioFormat;
  createdAt: number;
  updatedAt: number;
  pagesCount: number;
  previewThumbnail?: string;
  documentData: StudioDocument;
}

export interface StudioChatMessage {
  id: string;
  sender: 'user' | 'nasser';
  text: string;
  timestamp: number;
  suggestedActions?: string[];
}
