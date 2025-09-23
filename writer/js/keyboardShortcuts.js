import { hideShortcutHelper, showShortcutHelper } from './uiFeedback.js';
import { clearEditorAndReset } from './textareaManager.js';
import { loadMostRecentNote } from './noteManager.js';
import { toggleDarkTheme, toggleQuotesArea } from './themeManager.js';

// Handle keyboard shortcuts
export async function handleKeyboardShortcuts(e) {
  // Log the key event details
  console.log('Key pressed:', {
    key: e.key,
    code: e.code,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    shiftKey: e.shiftKey,
    altKey: e.altKey,
    target: e.target.tagName
  });

  // Ensure the window has focus before processing shortcuts
  if (!document.hasFocus()) {
    return;
  }

  // Only handle shortcuts if not typing in an input/textarea
  const activeElement = document.activeElement;
  const isTyping = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

  // Ctrl+Enter/Cmd+Enter to commit and clear
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    const submitEvent = new CustomEvent('submit', { detail: { shouldClear: true } });
    document.getElementById('editorForm').dispatchEvent(submitEvent);
    return;
  }

  // Ctrl+S/Cmd+S to commit without clearing (stay in edit mode)
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    const submitEvent = new CustomEvent('submit', { detail: { shouldClear: false } });
    document.getElementById('editorForm').dispatchEvent(submitEvent);
    return;
  }

  // Ctrl+L or Cmd+L to clear all inputs and reset to initial state
  if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
    e.preventDefault();
    clearEditorAndReset(true);
    return;
  }

  // Ctrl+R or Cmd+R to load most recent note
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'r') {
    e.preventDefault();
    await loadMostRecentNote();
    return;
  }

  // Ctrl+Shift+R or Cmd+Shift+R to refresh page
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
    e.preventDefault();
    window.location.reload();
    return;
  }

  // Ctrl+B or Cmd+B to toggle dark theme
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    toggleDarkTheme();
    return;
  }

  // Ctrl+H or Cmd+H to toggle quotes area visibility
  if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
    e.preventDefault();
    toggleQuotesArea();
    return;
  }

  // Escape to blur active textarea/input or close shortcut helper
  if (e.key === 'Escape') {
    e.preventDefault();
    const helper = document.getElementById('shortcutHelper');
    if (helper.style.opacity === '1') {
      hideShortcutHelper();
    } else if (isTyping) {
      activeElement.blur();
    }
    return;
  }

  // Forward slash (/) or 'i' to focus note input
  if ((e.key === '/' || e.key === 'i') && !isTyping) {
    e.preventDefault();
    const contentArea = document.getElementById('contentArea');
    contentArea.focus();
    // Move cursor to end of existing text
    contentArea.setSelectionRange(contentArea.value.length, contentArea.value.length);
  }

  // Question mark (?) to show keyboard shortcuts help
  if ((e.key === '?' || e.key === '？') && !isTyping) {
    e.preventDefault();
    showShortcutHelper();
  }

  // Right bracket (]) or 'I' to focus quotes/reference area
  if ((e.key === ']' || e.key === '】' || e.key === 'I') && !isTyping) {
    e.preventDefault();
    const referenceArea = document.getElementById('referenceArea');
    // Only focus if not disabled (not in edit mode)
    if (!referenceArea.disabled) {
      referenceArea.focus();
      // Move cursor to end of existing text
      referenceArea.setSelectionRange(referenceArea.value.length, referenceArea.value.length);
    }
  }

  // E key to focus note ID area
  if (e.key === 'e' && !isTyping) {
    e.preventDefault();
    const noteIdSelect = document.getElementById('noteIdSelect');
    // Only focus if not disabled
    if (!noteIdSelect.disabled) {
      noteIdSelect.focus();
      // Select all text for easy replacement
      noteIdSelect.select();
    }
  }

  // C key to focus chapter selection
  if (e.key === 'c' && !isTyping) {
    e.preventDefault();
    const fileSelect = document.getElementById('fileSelect');
    fileSelect.focus();
  }
}