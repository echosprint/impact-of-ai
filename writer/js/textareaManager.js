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

  // Auto-scroll down when textarea grows taller (for active element)
  if (preserveScroll && textarea === document.activeElement) {
    // Check if textarea height has increased
    const heightIncreased = newHeight > currentHeight;

    if (heightIncreased) {
      // Calculate how much the textarea grew
      const heightDifference = newHeight - currentHeight;

      // Instant scroll to match the height growth - no animation to prevent flashing
      window.scrollBy(0, heightDifference);
    }
  }
}

// Show source indicator with split preview
export function updateSourceIndicator(text) {
  const indicator = document.getElementById('sourceIndicator');
  const lastSourceIndicator = document.getElementById('lastSourceIndicator');
  const lastSourceText = document.getElementById('lastSourceText');

  const detection = TextUtils.detectSource(text);
  const hasFallback = EditorState.lastUsedSource && EditorState.lastUsedSource !== 'Source: [Null]';
  const hasText = text && text.trim().length > 0;

  // Case 1: Source detected in reference text (will be auto-split on submit)
  if (detection.isSource && detection.confidence > 0.5) {
    indicator.className = 'absolute bottom-4 right-4 text-xs transition-all duration-500 text-green-400/60 opacity-100';
    indicator.textContent = '◉';
    indicator.title = 'Source detected - will be auto-split';

    // Hide fallback indicator
    if (lastSourceIndicator) {
      lastSourceIndicator.classList.add('hidden');
    }
  }
  // Case 2: No source detected, has text, and fallback available (will use last source on submit)
  else if (hasText && hasFallback) {
    // Hide the triangle indicator - we'll show the full fallback below
    indicator.className = 'absolute bottom-4 right-4 text-xs transition-all duration-500 opacity-0 pointer-events-none';
    indicator.textContent = '';
    indicator.title = '';

    // Show fallback source below reference area
    if (lastSourceIndicator && lastSourceText) {
      lastSourceText.textContent = EditorState.lastUsedSource;
      lastSourceIndicator.classList.remove('hidden');
    }
  }
  // Case 3: No source, no fallback (will use "Source: [Null]")
  else {
    indicator.className = 'absolute bottom-4 right-4 text-xs transition-all duration-500 opacity-0 pointer-events-none';
    indicator.textContent = '';
    indicator.title = '';

    // Hide fallback indicator
    if (lastSourceIndicator) {
      lastSourceIndicator.classList.add('hidden');
    }
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
    referenceArea.style.backgroundColor = '#fefcf8';
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
  let pastedData = clipboardData?.getData('Text') || '';

  // Remove Zotero citations: patterns like ([text](zotero://...))
  pastedData = pastedData.replace(/\s*\(\[[^\]]*\]\s*\(zotero:\/\/[^)]+\)\)/g, '');

  // Trim whitespace first
  pastedData = pastedData.trim();

  // Remove surrounding quotes if text starts with ", ends with ", and has no " in middle
  // Handles both straight quotes (") and smart quotes ("")
  pastedData = pastedData.replace(/^["\u201C]([^"\u201C\u201D]+)["\u201D]$/, '$1');

  // Always prevent default paste to use our cleaned data
  e.preventDefault();

  // Get current cursor position
  const cursorStart = textarea.selectionStart;

  // Insert the cleaned text manually
  const before = textarea.value.substring(0, cursorStart);
  const after = textarea.value.substring(textarea.selectionEnd);
  textarea.value = before + pastedData + after;

  // Set cursor position after pasted text
  const newCursorPos = cursorStart + pastedData.length;
  textarea.setSelectionRange(newCursorPos, newCursorPos);

  // For large pastes, use smart scrolling
  if (pastedData.length > 100) {
    // Resize without changing scroll position initially
    autoResize(textarea, true);

    // Calculate where to scroll to show the pasted content
    const textBeforeCursor = textarea.value.substring(0, newCursorPos);
    const linesBeforeCursor = textBeforeCursor.split('\n').length;
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 22;
    const visibleLines = Math.floor(textarea.clientHeight / lineHeight);

    // Smart scroll: show some context above the cursor
    const targetScrollTop = Math.max(0, (linesBeforeCursor - Math.floor(visibleLines * 0.7)) * lineHeight);
    textarea.scrollTop = targetScrollTop;
  } else {
    // For small pastes, just resize
    autoResize(textarea, true);
  }

  // Update source indicator
  updateSourceIndicator(textarea.value);

  // Trigger input event for any other listeners
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}