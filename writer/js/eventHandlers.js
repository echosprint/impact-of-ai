import { EditorState } from './editorState.js';
import { hideShortcutHelper } from './uiFeedback.js';
import { autoResize } from './textareaManager.js';
import {
  handleContentAreaInput,
  handleCompositionStart,
  handleCompositionEnd,
  handleReferenceAreaInput,
  handleReferenceAreaPaste,
  initializeTextareas
} from './textareaManager.js';
import {
  handleFormSubmit,
  loadNotesForChapter,
  filterNotes,
  selectNote,
  loadFiles
} from './noteManager.js';
import { handleKeyboardShortcuts } from './keyboardShortcuts.js';
import { loadSavedQuotesAreaState } from './themeManager.js';

// Handle chapter selection change
export async function handleFileSelectChange(e) {
  const select = e.target;
  await loadNotesForChapter(select.value);

  // Clear content and reset to append mode when changing chapters
  const contentArea = document.getElementById('contentArea');
  const referenceArea = document.getElementById('referenceArea');
  contentArea.value = '';
  referenceArea.value = '';
  referenceArea.disabled = false;
  referenceArea.style.backgroundColor = '#f5f4f0';
  referenceArea.style.color = '';
  autoResize(contentArea);
  autoResize(referenceArea);
}

// Handle note selection change (UI state only, not loading)
export function handleNoteIdSelectChange(e) {
  const select = e.target;
  let noteId = select.value;
  const referenceArea = document.getElementById('referenceArea');

  // Clean noteId (remove # if present)
  if (noteId) {
    noteId = noteId.replace(/^#/, '');
  }

  if (noteId) {
    // Edit mode UI: just disable reference area, don't load note
    referenceArea.disabled = true;
    referenceArea.style.backgroundColor = '#ebe9e5';
    referenceArea.style.color = '#999';
  } else {
    // Append mode: enable reference area
    referenceArea.disabled = false;
    referenceArea.style.backgroundColor = '#f5f4f0';
    referenceArea.style.color = '';
  }
}

// Handle window load
export function handleWindowLoad() {
  initializeTextareas();
  loadSavedQuotesAreaState();
}

// Handle note ID input (search functionality)
export function handleNoteIdInput(e) {
  const searchTerm = e.target.value;
  filterNotes(searchTerm);
}

// Handle keyboard navigation in note ID input
export async function handleNoteIdKeydown(e) {
  const dropdown = document.getElementById('noteIdDropdown');
  const items = dropdown.querySelectorAll('.dropdown-item');

  if (dropdown.classList.contains('hidden') || items.length === 0) {
    return;
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      EditorState.selectedDropdownIndex = Math.min(EditorState.selectedDropdownIndex + 1, items.length - 1);
      updateDropdownSelection(items);
      break;

    case 'ArrowUp':
      e.preventDefault();
      EditorState.selectedDropdownIndex = Math.max(EditorState.selectedDropdownIndex - 1, -1);
      updateDropdownSelection(items);
      break;

    case 'Enter':
      e.preventDefault();
      if (EditorState.selectedDropdownIndex >= 0 && EditorState.selectedDropdownIndex < items.length) {
        const selectedItem = items[EditorState.selectedDropdownIndex];
        const noteId = selectedItem.getAttribute('data-note-id');
        await selectNote(noteId);
      }
      break;

    case 'Escape':
      e.preventDefault();
      dropdown.classList.add('hidden');
      EditorState.selectedDropdownIndex = -1;
      break;
  }
}

// Update visual selection in dropdown
function updateDropdownSelection(items) {
  items.forEach((item, index) => {
    if (index === EditorState.selectedDropdownIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

// Handle note ID input focus
export function handleNoteIdFocus(e) {
  if (EditorState.allNotes.length > 0) {
    // Show all notes on focus, regardless of current input value
    filterNotes(e.target.value);
  }
}

// Handle note ID input blur - revert to current note if any
export function handleNoteIdBlur(e) {
  const noteIdSelect = e.target;
  if (EditorState.currentNoteId) {
    // Revert to current note being edited
    noteIdSelect.value = `#${EditorState.currentNoteId}`;
  } else {
    // Clear field if no current note
    noteIdSelect.value = '';
  }
}

// Handle clicks on dropdown items
export async function handleDropdownClick(e) {
  const item = e.target.closest('[data-note-id]');
  if (item) {
    const noteId = item.getAttribute('data-note-id');
    await selectNote(noteId);
  }
}

// Hide dropdown when clicking outside
export function handleDocumentClick(e) {
  const noteIdSelect = document.getElementById('noteIdSelect');
  const dropdown = document.getElementById('noteIdDropdown');

  if (!noteIdSelect.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
}

// Initialize all event handlers
export function initializeEventHandlers() {
  // Form and textarea events
  document.getElementById('editorForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('contentArea').addEventListener('input', handleContentAreaInput);
  document.getElementById('contentArea').addEventListener('compositionstart', handleCompositionStart);
  document.getElementById('contentArea').addEventListener('compositionend', handleCompositionEnd);
  document.getElementById('referenceArea').addEventListener('input', handleReferenceAreaInput);
  document.getElementById('referenceArea').addEventListener('paste', handleReferenceAreaPaste);

  // Global keyboard and UI events
  document.addEventListener('keydown', handleKeyboardShortcuts);
  document.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable right-click

  // Shortcut helper modal events
  document.getElementById('closeShortcutHelper').addEventListener('click', hideShortcutHelper);
  document.getElementById('shortcutHelper').addEventListener('click', (e) => {
    if (e.target.id === 'shortcutHelper') hideShortcutHelper(); // Click outside modal to close
  });

  // File and note selection events
  document.getElementById('fileSelect').addEventListener('change', handleFileSelectChange);
  document.getElementById('noteIdSelect').addEventListener('change', handleNoteIdSelectChange);
  document.getElementById('noteIdSelect').addEventListener('input', handleNoteIdInput);
  document.getElementById('noteIdSelect').addEventListener('focus', handleNoteIdFocus);
  document.getElementById('noteIdSelect').addEventListener('blur', handleNoteIdBlur);
  document.getElementById('noteIdSelect').addEventListener('keydown', handleNoteIdKeydown);
  document.getElementById('noteIdDropdown').addEventListener('click', handleDropdownClick);

  // Document and window events
  document.addEventListener('click', handleDocumentClick);
  window.addEventListener('load', handleWindowLoad);
}