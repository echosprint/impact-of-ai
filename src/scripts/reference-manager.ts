/**
 * Reference management system for positioning and visibility
 */

import { LAYOUT_CONFIG, Z_INDEX } from '../config/layout';
import {
  calculateLayout,
  generatePositionConfig,
  applyPositionToElement,
  getScreenInfo,
  findActiveReference,
  throttle,
  debounce,
} from '../utils/reference-positioning';
import type { ReferenceItem, ElementRefs } from '../types/references';

class ReferenceManager {
  private referencesInColumn: ReferenceItem[] = [];
  private isInitialized = false;
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null;
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  private isScrolling = false;
  private lastScrollTime = 0;

  constructor() {
    this.updateReferenceVisibility = throttle(
      this.updateReferenceVisibility.bind(this),
      LAYOUT_CONFIG.SCROLL_THROTTLE_MS
    );
    
    this.handleResize = debounce(
      this.handleResize.bind(this),
      LAYOUT_CONFIG.RESIZE_DEBOUNCE_MS
    );
  }

  /**
   * Initialize the reference management system
   */
  public initialize(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Wait for content to render
    setTimeout(() => {
      this.positionReferences();
      this.updateReferenceVisibility();
      this.addClickHandlers();
      
      // Handle image loading
      this.handleImageLoading();
    }, LAYOUT_CONFIG.CONTENT_RENDER_DELAY_MS);

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Position references in the right column aligned with their notes
   */
  private positionReferences(): void {
    const referencesColumn = document.getElementById('references-column');
    if (!referencesColumn || window.innerWidth < LAYOUT_CONFIG.DESKTOP_BREAKPOINT) return;
    
    console.log('Positioning references...');
    
    // Set up references column for fixed positioning
    referencesColumn.style.position = 'relative';
    referencesColumn.style.pointerEvents = 'none';
    
    // Clear existing references
    referencesColumn.innerHTML = '';
    this.referencesInColumn = [];
    
    // Get all note contents and their corresponding references
    const noteContents = document.querySelectorAll('.note-inline-content[data-note-id]');
    console.log(`Found ${noteContents.length} note contents`);
    
    noteContents.forEach((noteContent) => {
      const noteId = noteContent.getAttribute('data-note-id');
      if (!noteId) return;
      
      const referenceElement = document.querySelector(`.reference-for-positioning[data-note-id=\"${noteId}\"]`);
      console.log(`Processing note ${noteId}, reference found:`, !!referenceElement);
      
      if (referenceElement) {
        const clonedReference = this.cloneReferenceElement(referenceElement as HTMLElement, noteId);
        referencesColumn.appendChild(clonedReference);
        this.referencesInColumn.push({
          noteId,
          element: clonedReference,
          noteElement: noteContent as HTMLElement
        });
      }
    });
    
    console.log(`Added ${this.referencesInColumn.length} references to column`);
    this.updateReferenceVisibility();
  }

  /**
   * Clone and configure a reference element
   */
  private cloneReferenceElement(referenceElement: HTMLElement, noteId: string): HTMLElement {
    const clonedReference = referenceElement.cloneNode(true) as HTMLElement;
    clonedReference.classList.remove('hidden');
    clonedReference.style.display = 'none';
    clonedReference.style.pointerEvents = 'auto';
    
    // Ensure reference starts in collapsed state
    const refs = this.getElementRefs(clonedReference);
    this.collapseReference(refs);
    
    // Set up event handlers
    this.setupReferenceEventHandlers(clonedReference, refs);
    
    return clonedReference;
  }

  /**
   * Get element references for expand/collapse functionality
   */
  private getElementRefs(element: HTMLElement): ElementRefs {
    return {
      referenceCard: element.querySelector('.reference-card') as HTMLElement,
      expandIcon: element.querySelector('.expand-icon') as HTMLElement,
      collapseIcon: element.querySelector('.collapse-icon') as HTMLElement,
      expandToggle: element.querySelector('.expand-toggle') as HTMLElement,
    };
  }

  /**
   * Collapse a reference to its default state
   */
  private collapseReference(refs: ElementRefs): void {
    if (refs.referenceCard && refs.expandIcon && refs.collapseIcon && refs.expandToggle) {
      refs.referenceCard.classList.remove('expanded');
      refs.expandIcon.classList.remove('hidden');
      refs.collapseIcon.classList.add('hidden');
      refs.expandToggle.setAttribute('aria-label', 'Expand reference');
    }
  }

  /**
   * Expand a reference to show more content
   */
  private expandReference(refs: ElementRefs): void {
    if (refs.referenceCard && refs.expandIcon && refs.collapseIcon && refs.expandToggle) {
      refs.referenceCard.classList.add('expanded');
      refs.expandIcon.classList.add('hidden');
      refs.collapseIcon.classList.remove('hidden');
      refs.expandToggle.setAttribute('aria-label', 'Collapse reference');
    }
  }

  /**
   * Set up event handlers for a reference element
   */
  private setupReferenceEventHandlers(element: HTMLElement, refs: ElementRefs): void {
    if (!refs.expandToggle || !refs.referenceCard) return;

    const handleToggle = (e: Event) => {
      e.stopPropagation();
      const isExpanded = refs.referenceCard!.classList.contains('expanded');
      
      if (isExpanded) {
        this.collapseReference(refs);
      } else {
        this.expandReference(refs);
      }
    };

    const handleCardClick = (e: Event) => {
      e.stopPropagation();
    };

    const handleOutsideClick = (e: Event) => {
      if (refs.referenceCard!.classList.contains('expanded') && 
          !refs.referenceCard!.contains(e.target as Node)) {
        this.collapseReference(refs);
      }
    };

    refs.expandToggle.addEventListener('click', handleToggle);
    refs.referenceCard.addEventListener('click', handleCardClick);
    document.addEventListener('click', handleOutsideClick);
    
    // Store reference for cleanup
    (refs.referenceCard as any)._outsideClickHandler = handleOutsideClick;
  }

  /**
   * Update visibility of references based on viewport position
   */
  private updateReferenceVisibility(): void {
    const referencesColumn = document.getElementById('references-column');
    if (!referencesColumn) return;
    
    const activeReference = findActiveReference(this.referencesInColumn);
    
    // Update visual states
    this.referencesInColumn.forEach(ref => {
      const shouldShow = (ref === activeReference);
      const currentOpacity = parseFloat(ref.element.style.opacity) || 0;
      const isCurrentlyActive = ref.noteElement.classList.contains('note-active');
      
      if (shouldShow) {
        this.showReference(ref, currentOpacity < 1);
        if (!isCurrentlyActive) {
          ref.noteElement.classList.add('note-active');
        }
      } else {
        this.hideReference(ref, currentOpacity > 0);
        if (isCurrentlyActive) {
          ref.noteElement.classList.remove('note-active', 'note-highlighted');
        }
      }
    });
    
    // Update click handlers after visibility changes
    this.addClickHandlers();
  }

  /**
   * Show a reference element
   */
  private showReference(ref: ReferenceItem, needsPositioning: boolean): void {
    if (needsPositioning) {
      // Force collapse when showing reference
      const refs = this.getElementRefs(ref.element);
      this.collapseReference(refs);
      
      // Calculate and apply positioning
      const referencesColumn = document.getElementById('references-column');
      const columnRect = referencesColumn?.getBoundingClientRect() || null;
      const bookContent = document.querySelector('.book-content');
      const bookContentRect = bookContent?.getBoundingClientRect() || null;
      const effectiveWidth = window.innerWidth;
      
      const layout = calculateLayout(effectiveWidth, columnRect, bookContentRect);
      const config = generatePositionConfig(layout);
      applyPositionToElement(ref.element, config);
      
      console.log(`Showing reference ${ref.noteId}:`, {
        effectiveWidth: `${effectiveWidth}px`,
        width: config.width,
        position: config.left || `right: ${config.right}`,
        layout
      });
    }
  }

  /**
   * Hide a reference element
   */
  private hideReference(ref: ReferenceItem, needsHiding: boolean): void {
    if (needsHiding) {
      ref.element.style.transition = `opacity ${LAYOUT_CONFIG.ANIMATION_DURATION_MS}ms ease-in-out`;
      ref.element.style.opacity = '0';
      
      setTimeout(() => {
        if (parseFloat(ref.element.style.opacity) === 0) {
          ref.element.style.display = 'none';
        }
      }, LAYOUT_CONFIG.ANIMATION_DURATION_MS);
      
      console.log(`Hiding reference ${ref.noteId}`);
    }
  }

  /**
   * Add click handlers for inactive notes
   */
  private addClickHandlers(): void {
    const inactiveNotes = document.querySelectorAll('.note-inline-content[data-has-reference=\"true\"]:not(.note-active)');
    
    inactiveNotes.forEach(noteElement => {
      noteElement.removeEventListener('click', this.handleNoteClick);
      noteElement.addEventListener('click', this.handleNoteClick);
    });
  }

  /**
   * Handle click on a note element
   */
  private handleNoteClick = (event: Event): void => {
    const noteElement = event.currentTarget as HTMLElement;
    const noteId = noteElement.getAttribute('data-note-id');
    
    if (!noteId) return;
    
    const referenceItem = this.referencesInColumn.find(ref => ref.noteId === noteId);
    if (!referenceItem) return;
    
    // Clear all active states
    this.referencesInColumn.forEach(ref => {
      ref.noteElement.classList.remove('note-active');
      if (parseFloat(ref.element.style.opacity) > 0) {
        this.hideReference(ref, true);
      }
    });
    
    // Activate the clicked note after a delay
    setTimeout(() => {
      this.showReference(referenceItem, true);
      noteElement.classList.add('note-active');
      setTimeout(() => this.addClickHandlers(), 100);
    }, LAYOUT_CONFIG.ANIMATION_DURATION_MS + 50);
  };

  /**
   * Handle image loading to reposition references
   */
  private handleImageLoading(): void {
    const images = document.querySelectorAll('img');
    if (images.length === 0) return;
    
    let loadedImages = 0;
    const checkAllLoaded = () => {
      loadedImages++;
      if (loadedImages === images.length) {
        setTimeout(() => {
          this.positionReferences();
          this.updateReferenceVisibility();
          this.addClickHandlers();
        }, LAYOUT_CONFIG.IMAGE_LOAD_DELAY_MS);
      }
    };
    
    images.forEach(img => {
      if (img.complete) {
        checkAllLoaded();
      } else {
        img.addEventListener('load', checkAllLoaded);
        img.addEventListener('error', checkAllLoaded);
      }
    });
  }

  /**
   * Handle window resize
   */
  private handleResize = (): void => {
    this.positionReferences();
    this.updateReferenceVisibility();
    this.addClickHandlers();
  };

  /**
   * Handle scroll events
   */
  private handleScroll = (): void => {
    const now = Date.now();
    
    // Throttle scroll events
    if (now - this.lastScrollTime < LAYOUT_CONFIG.SCROLL_THROTTLE_MS) return;
    this.lastScrollTime = now;
    
    if (!this.isScrolling) {
      this.isScrolling = true;
      
      requestAnimationFrame(() => {
        this.updateReferenceVisibility();
        this.isScrolling = false;
      });
    }
    
    // Fallback timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      if (!this.isScrolling) {
        this.updateReferenceVisibility();
      }
    }, 100);
  };

  /**
   * Set up global event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('scroll', this.handleScroll);
  }

  /**
   * Clean up event listeners and resources
   */
  public destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleScroll);
    
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    this.referencesInColumn = [];
    this.isInitialized = false;
  }
}

// Global instance
let referenceManager: ReferenceManager | null = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (!referenceManager) {
    referenceManager = new ReferenceManager();
    referenceManager.initialize();
  }
});

export default ReferenceManager;