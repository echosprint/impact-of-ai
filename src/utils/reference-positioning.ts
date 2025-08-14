/**
 * Reference positioning and visibility utilities
 */

import { LAYOUT_CONFIG, RESPONSIVE_CONFIG, Z_INDEX } from '../config/layout';
import type { 
  ReferenceItem, 
  LayoutCalculation, 
  ScreenInfo, 
  VisibilityCalculation, 
  PositionConfig 
} from '../types/references';

/**
 * Calculate layout dimensions for reference positioning
 */
export function calculateLayout(
  effectiveWidth: number,
  columnRect: DOMRect | null,
  bookContentRect: DOMRect | null
): LayoutCalculation {
  if (effectiveWidth >= LAYOUT_CONFIG.DESKTOP_BREAKPOINT) {
    // Desktop/large screens - use proportional sizing
    if (columnRect) {
      const columnWidth = columnRect.width * LAYOUT_CONFIG.REFERENCE_WIDTH_PERCENTAGE;
      const leftOffset = columnRect.left + (columnRect.width - columnWidth) / 2;
      
      return {
        effectiveWidth,
        referenceWidth: columnWidth,
        margin: 0,
        position: 'left',
        leftOffset,
      };
    } else if (bookContentRect) {
      const bookContentEnd = bookContentRect.right;
      const rightAreaWidth = effectiveWidth - bookContentEnd;
      const referenceWidth = Math.max(
        rightAreaWidth * LAYOUT_CONFIG.REFERENCE_RIGHT_AREA_PERCENTAGE, 
        LAYOUT_CONFIG.MIN_REFERENCE_WIDTH
      );
      const rightMargin = rightAreaWidth * LAYOUT_CONFIG.REFERENCE_RIGHT_MARGIN_PERCENTAGE;
      
      return {
        effectiveWidth,
        referenceWidth,
        margin: rightMargin,
        position: 'right',
        rightOffset: rightMargin,
      };
    } else {
      // Fallback
      const referenceWidth = Math.max(
        effectiveWidth * LAYOUT_CONFIG.REFERENCE_VIEWPORT_PERCENTAGE, 
        LAYOUT_CONFIG.MIN_REFERENCE_WIDTH_FALLBACK
      );
      const margin = effectiveWidth * LAYOUT_CONFIG.REFERENCE_VIEWPORT_MARGIN_PERCENTAGE;
      
      return {
        effectiveWidth,
        referenceWidth,
        margin,
        position: 'right',
        rightOffset: margin,
      };
    }
  } else {
    // Mobile/tablet - full width with margins
    return {
      effectiveWidth,
      referenceWidth: 0, // auto width
      margin: 0,
      position: 'left',
    };
  }
}

/**
 * Generate position configuration for reference element
 */
export function generatePositionConfig(layout: LayoutCalculation): PositionConfig {
  const config: PositionConfig = {
    position: 'fixed',
    top: '50vh',
    transform: 'translateY(-50%)',
    zIndex: Z_INDEX.REFERENCE_BASE.toString(),
    display: 'block',
    transition: `opacity ${LAYOUT_CONFIG.ANIMATION_DURATION_MS}ms ease-in-out`,
    opacity: '1',
    width: layout.referenceWidth > 0 ? `${layout.referenceWidth}px` : 'auto',
  };

  if (layout.effectiveWidth >= LAYOUT_CONFIG.DESKTOP_BREAKPOINT) {
    if (layout.position === 'left' && layout.leftOffset !== undefined) {
      config.left = `${layout.leftOffset}px`;
    } else if (layout.position === 'right' && layout.rightOffset !== undefined) {
      config.right = `${layout.rightOffset}px`;
    }
  } else {
    // Mobile/tablet
    config.left = LAYOUT_CONFIG.MOBILE_MARGIN;
    config.right = LAYOUT_CONFIG.MOBILE_MARGIN;
    config.width = 'auto';
  }

  return config;
}

/**
 * Apply position configuration to element
 */
export function applyPositionToElement(element: HTMLElement, config: PositionConfig): void {
  Object.entries(config).forEach(([key, value]) => {
    if (value !== undefined) {
      element.style.setProperty(key, value);
    }
  });
}

/**
 * Get comprehensive screen information for debugging
 */
export function getScreenInfo(): ScreenInfo {
  return {
    windowInnerWidth: window.innerWidth,
    windowInnerHeight: window.innerHeight,
    screenWidth: screen.width,
    screenHeight: screen.height,
    screenAvailWidth: screen.availWidth,
    screenAvailHeight: screen.availHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    windowOuterWidth: window.outerWidth,
    windowOuterHeight: window.outerHeight,
  };
}

/**
 * Calculate visibility score for a reference item
 */
export function calculateVisibility(ref: ReferenceItem): VisibilityCalculation {
  const noteRect = ref.noteElement.getBoundingClientRect();
  const noteTop = noteRect.top;
  const noteBottom = noteRect.bottom;
  const noteCenter = noteTop + noteRect.height / 2;
  
  const viewportHeight = window.innerHeight;
  const centerY = viewportHeight / 2;
  const centerTolerance = viewportHeight * LAYOUT_CONFIG.VIEWPORT_CENTER_TOLERANCE;
  
  // Check if note is at least partially visible
  const isVisible = (noteBottom > 0) && (noteTop < viewportHeight);
  
  let visibilityScore = 0;
  let centerBonus = 0;
  let finalScore = 0;
  
  if (isVisible) {
    // Calculate how much of the note is in the center area
    const centerStart = centerY - centerTolerance;
    const centerEnd = centerY + centerTolerance;
    
    const visibleStart = Math.max(noteTop, centerStart);
    const visibleEnd = Math.min(noteBottom, centerEnd);
    const visibleHeight = Math.max(0, visibleEnd - visibleStart);
    
    // Calculate visibility score (how prominent this note is)
    const totalHeight = noteRect.height;
    visibilityScore = visibleHeight / totalHeight;
    
    // Boost score for notes closer to center
    const distanceFromCenter = Math.abs(noteCenter - centerY);
    centerBonus = Math.max(0, 1 - (distanceFromCenter / centerTolerance));
    finalScore = visibilityScore * (1 + centerBonus);
  }
  
  return {
    noteRect,
    noteTop,
    noteBottom,
    noteCenter,
    isVisible,
    visibilityScore,
    centerBonus,
    finalScore,
  };
}

/**
 * Find the most prominent reference in the viewport
 */
export function findActiveReference(references: ReferenceItem[]): ReferenceItem | null {
  let activeReference: ReferenceItem | null = null;
  let maxVisibility = 0;
  
  references.forEach(ref => {
    const visibility = calculateVisibility(ref);
    
    if (visibility.finalScore > maxVisibility && visibility.finalScore > LAYOUT_CONFIG.MINIMUM_VISIBILITY_THRESHOLD) {
      maxVisibility = visibility.finalScore;
      activeReference = ref;
    }
  });
  
  return activeReference;
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T, 
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Debounce function for resize events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}