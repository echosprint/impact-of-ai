/**
 * TypeScript interfaces for reference system
 */

export interface ReferenceText {
  id: string;
  content: string;
  source?: string;
  page?: string;
  note?: string;
}

export interface ReferenceItem {
  noteId: string;
  element: HTMLElement;
  noteElement: HTMLElement;
}

export interface ReferenceState {
  isExpanded: boolean;
  isVisible: boolean;
  isActive: boolean;
  opacity: number;
}

export interface LayoutCalculation {
  effectiveWidth: number;
  referenceWidth: number;
  margin: number;
  position: 'left' | 'right';
  leftOffset?: number;
  rightOffset?: number;
}

export interface ScreenInfo {
  windowInnerWidth: number;
  windowInnerHeight: number;
  screenWidth: number;
  screenHeight: number;
  screenAvailWidth: number;
  screenAvailHeight: number;
  devicePixelRatio: number;
  windowOuterWidth: number;
  windowOuterHeight: number;
}

export interface VisibilityCalculation {
  noteRect: DOMRect;
  noteTop: number;
  noteBottom: number;
  noteCenter: number;
  isVisible: boolean;
  visibilityScore: number;
  centerBonus: number;
  finalScore: number;
}

export interface PositionConfig {
  position: string;
  top: string;
  transform: string;
  zIndex: string;
  display: string;
  transition: string;
  opacity: string;
  left?: string;
  right?: string;
  width: string;
}

export interface ElementRefs {
  referenceCard?: HTMLElement;
  expandIcon?: HTMLElement;
  collapseIcon?: HTMLElement;
  expandToggle?: HTMLElement;
}

export interface ComponentProps {
  ref: string;
  noteId?: string;
  noteContent?: string;
  referenceText?: string;
}

export interface ChapterData {
  title: string;
  description?: string;
  publishDate?: Date;
  chapter: number;
  route?: string;
  body: string;
}