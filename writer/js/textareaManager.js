import { TextUtils } from './textUtils.js';
import { EditorState } from './editorState.js';

// Auto-resize textarea while preserving scroll position
export function autoResize(textarea, preserveScroll = true) {
  // Save current state before any changes
  const scrollTop = textarea.scrollTop;
  const cursorPosition = textarea.selectionStart;
  const currentHeight = textarea.offsetHeight;

  // Create a hidden clone to measure content height without disrupting the original
  const clone = textarea.cloneNode(true);
  clone.style.position = 'absolute';
  clone.style.visibility = 'hidden';
  clone.style.height = 'auto';
  clone.style.minHeight = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'hidden';
  clone.style.zIndex = '-1000';
  clone.value = textarea.value;

  // Copy all computed styles to ensure accurate measurement
  const computedStyle = window.getComputedStyle(textarea);
  clone.style.width = computedStyle.width;
  clone.style.padding = computedStyle.padding;
  clone.style.border = computedStyle.border;
  clone.style.boxSizing = computedStyle.boxSizing;
  clone.style.fontFamily = computedStyle.fontFamily;
  clone.style.fontSize = computedStyle.fontSize;
  clone.style.lineHeight = computedStyle.lineHeight;
  clone.style.letterSpacing = computedStyle.letterSpacing;
  clone.style.wordSpacing = computedStyle.wordSpacing;

  // Temporarily add to DOM to measure
  textarea.parentNode.insertBefore(clone, textarea);
  const newHeight = Math.max(clone.scrollHeight + 10, 200);
  textarea.parentNode.removeChild(clone);

  // Always update height to prevent scrollbars, even for small changes
  textarea.style.height = newHeight + 'px';

  // Ensure overflow is hidden to prevent scrollbars
  textarea.style.overflow = 'hidden';

  // Smart cursor positioning for better typing experience (only for active element)
  if (preserveScroll && textarea === document.activeElement) {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      const textBeforeCursor = textarea.value.substring(0, cursorPosition);
      const linesBeforeCursor = textBeforeCursor.split('\n').length;
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 22;

      // Get current viewport info
      const textareaRect = textarea.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isTextareaLarge = textareaRect.height > viewportHeight * 0.6;

      if (isTextareaLarge) {
        // Calculate cursor position relative to viewport
        const targetCursorY = viewportHeight * 0.4; // 40% from top
        const currentCursorY = textareaRect.top + (linesBeforeCursor * lineHeight);

        // Only scroll if cursor is significantly below target
        if (currentCursorY > targetCursorY + 50) {
          const scrollOffset = currentCursorY - targetCursorY;
          window.scrollTo({
            top: window.scrollY + scrollOffset,
            behavior: 'smooth'
          });
        }
      }
    });
  }
}

// Show source indicator with split preview
export function updateSourceIndicator(text) {
  const indicator = document.getElementById('sourceIndicator');
  const detection = TextUtils.detectSource(text);

  if (detection.isSource && detection.confidence > 0.5) {
    indicator.className = 'absolute bottom-4 right-4 text-xs transition-all duration-500 text-green-400/60 opacity-100';
    indicator.textContent = '◉';
  } else if (detection.isSource && detection.confidence > 0.3) {
    indicator.className = 'absolute bottom-4 right-4 text-xs transition-all duration-500 text-amber-500/60 opacity-100';
    indicator.textContent = '◯';
  } else {
    indicator.className = 'absolute bottom-4 right-4 text-xs transition-all duration-500 opacity-0 pointer-events-none';
    indicator.textContent = '';
  }
}

// Initialize auto-resize on load
export function initializeTextareas() {
  const contentArea = document.getElementById('contentArea');
  const referenceArea = document.getElementById('referenceArea');
  autoResize(contentArea);
  autoResize(referenceArea);
  // Initialize character counter
  updateCharacterCounter(contentArea, 'contentCounter');
}

// Update character counter
export function updateCharacterCounter(textarea, counterId) {
  const counter = document.getElementById(counterId);
  const count = TextUtils.countCharacters(textarea.value);
  counter.textContent = count.toLocaleString();

  counter.style.display = count >0 ? '' : 'none';
 
}

// Clear input areas and reset editor state
export function clearEditorAndReset(isEditMode) {
  const contentArea = document.getElementById('contentArea');
  const referenceArea = document.getElementById('referenceArea');

  // Clear input areas
  contentArea.value = '';
  referenceArea.value = '';
  autoResize(contentArea);
  autoResize(referenceArea);
  updateSourceIndicator(''); // Clear source indicator
  updateCharacterCounter(contentArea, 'contentCounter'); // Reset counter

  if (isEditMode) {
    // Reset note selection to append mode
    const noteIdSelect = document.getElementById('noteIdSelect');
    noteIdSelect.value = '';
    EditorState.currentNoteId = '';

    // Re-enable reference area for new content
    referenceArea.disabled = false;
    referenceArea.style.backgroundColor = '#f5f4f0';
    referenceArea.style.color = '';
  }
}

// Handle composition start (pinyin input begins)
export function handleCompositionStart(e) {
  EditorState.isComposing = true;
}

// Handle composition end (pinyin input finishes)
export function handleCompositionEnd(e) {
  EditorState.isComposing = false;
  // Update counter after composition is complete
  updateCharacterCounter(e.target, 'contentCounter');
}

// Handle content area input
export function handleContentAreaInput(e) {
  // Single auto-resize call with smart positioning
  autoResize(e.target, true);

  // Only update counter if not in the middle of pinyin composition
  if (!EditorState.isComposing) {
    updateCharacterCounter(e.target, 'contentCounter');
  }
}

// Handle reference area input
export function handleReferenceAreaInput(e) {
  const textarea = e.target;
  autoResize(textarea);
  updateSourceIndicator(textarea.value);
}

// Handle paste events specifically to prevent unwanted scrolling
export function handleReferenceAreaPaste(e) {
  const textarea = e.target;

  // Get paste data
  const clipboardData = e.clipboardData || window.clipboardData;
  const pastedData = clipboardData?.getData('Text') || '';

  // If it's a large paste, handle it specially
  if (pastedData.length > 100) {
    e.preventDefault(); // Prevent default paste behavior

    // Get current cursor position
    const cursorStart = textarea.selectionStart;

    // Insert the text manually
    const before = textarea.value.substring(0, cursorStart);
    const after = textarea.value.substring(textarea.selectionEnd);
    textarea.value = before + pastedData + after;

    // Set cursor position after pasted text
    const newCursorPos = cursorStart + pastedData.length;

    // Resize without changing scroll position initially
    autoResize(textarea, true);

    // Calculate where to scroll to show the pasted content
    const textBeforeCursor = textarea.value.substring(0, newCursorPos);
    const linesBeforeCursor = textBeforeCursor.split('\n').length;
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 22;
    const visibleLines = Math.floor(textarea.clientHeight / lineHeight);

    // Position cursor
    textarea.setSelectionRange(newCursorPos, newCursorPos);

    // Smart scroll: show some context above the cursor
    const targetScrollTop = Math.max(0, (linesBeforeCursor - Math.floor(visibleLines * 0.7)) * lineHeight);
    textarea.scrollTop = targetScrollTop;

    // Update source indicator
    updateSourceIndicator(textarea.value);

    // Trigger input event for any other listeners
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // For small pastes, use normal handling with slight delay
    setTimeout(() => {
      autoResize(textarea, true);
      updateSourceIndicator(textarea.value);
    }, 10);
  }
}