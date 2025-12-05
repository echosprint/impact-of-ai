import { API_CONFIG } from './config.js';
import { TextUtils } from './textUtils.js';
import { UIFeedback } from './uiFeedback.js';
import { EditorState } from './editorState.js';
import { autoResize, updateSourceIndicator, updateCharacterCounter, clearEditorAndReset } from './textareaManager.js';
import { getCurrentSection, setCurrentSection, loadSections } from './sectionManager.js';

// Load available files
export async function loadFiles() {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.files}`);
    const data = await response.json();

    const select = document.getElementById('fileSelect');
    select.innerHTML = '<option value="">Chapters...</option>';

    data.files.forEach((fileData) => {
      const option = document.createElement('option');
      const fileName = fileData.name || fileData; // Handle both object and string format
      option.value = fileName;
      option.textContent = fileName.replace(/\.(md|mdx)$/, '');
      select.appendChild(option);
    });

    // Auto-select the most recently modified file and trigger section loading
    if (data.lastModified) {
      select.value = data.lastModified;
      await loadNotesForChapter(data.lastModified);

      // Trigger section loading
      const sections = await loadSections(data.lastModified);

      // Enable section dropdown and auto-select first section
      const sectionSelect = document.getElementById('section-select');
      sectionSelect.disabled = false;

      if (sections && sections.length > 0) {
        sectionSelect.value = sections[0];
        EditorState.currentSection = sections[0];
      }
    }
  } catch (error) {
    await UIFeedback.showMessage('Failed to load files', 'error');
  }
}

// Generate unique noteId ensuring no conflicts within the same file
export async function generateUniqueNoteId(content, reference, filename) {
  // Get existing note IDs from the current file
  const existingIds = await getExistingNoteIds(filename);

  let counter = 0;
  let noteId = generateBaseNoteId(content, reference, counter);

  // Ensure uniqueness by incrementing counter if needed
  while (existingIds.has(noteId)) {
    counter++;
    noteId = generateBaseNoteId(content, reference, counter);
  }

  return noteId;
}

// Generate base noteId using content + reference + timestamp + counter, then hash to 5 chars
function generateBaseNoteId(content, reference, counter = 0) {
  const timestamp = Date.now().toString();
  const combined = content.trim() + '|' + reference.trim() + '|' + timestamp + '|' + counter;

  // Better hash function (FNV-1a variant)
  let hash = 2166136261 + counter; // Add counter to initial hash
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash = (hash * 16777619) >>> 0; // Keep as 32-bit unsigned
  }

  // Convert to hex and take first 5 chars
  return hash.toString(16).substring(0, 5);
}

// Get existing note IDs from a file
async function getExistingNoteIds(filename) {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.notes(filename)}`);
    if (!response.ok) return new Set();

    const data = await response.json();
    return new Set(data.notes?.map((note) => note.id) || []);
  } catch (error) {
    console.warn('Failed to fetch existing note IDs:', error);
    return new Set();
  }
}

// Handle form submission
export async function handleFormSubmit(e) {
  e.preventDefault();

  // Prevent submission if message is currently showing
  if (UIFeedback.isMessageShowing) {
    return;
  }

  // Check if this is from keyboard shortcut with shouldClear parameter
  const shouldClear = e.detail?.shouldClear !== false; // Default to true for button clicks

  const select = document.getElementById('fileSelect');
  const contentArea = document.getElementById('contentArea');
  const referenceArea = document.getElementById('referenceArea');

  const filename = select.value;
  const content = contentArea.value;
  const reference = referenceArea.value;

  if (!filename) {
    await UIFeedback.showMessage('Please select a chapter', 'error');
    return;
  }

  if (!content.trim()) {
    // Reload chapters and notes to refresh the interface
    await loadFiles();
    if (filename) {
      await loadNotesForChapter(filename);
    }
    return;
  }

  // Check if we're in edit mode by looking at selected noteId
  const noteIdSelect = document.getElementById('noteIdSelect');
  const selectedNoteId = noteIdSelect.value;
  const isEditMode = !!selectedNoteId;

  // In edit mode, use original reference content to preserve quotes/source
  const finalReference = isEditMode ? EditorState.originalReference : reference;

  // Only generate new noteId for append mode
  let currentNoteId;
  if (isEditMode) {
    currentNoteId = selectedNoteId.replace(/^#/, ''); // Clean the # prefix from selected ID
  } else {
    const noteId = await generateUniqueNoteId(content.trim(), reference.trim(), filename);
    currentNoteId = noteId;
  }

  // Get current timestamp in ISO format
  const timestamp = new Date().toISOString();

  // Format as Note component with smart source detection (same logic for both modes)
  let finalContent;
  if (finalReference.trim()) {
    // Has reference text
    const detection = TextUtils.detectSource(finalReference.trim());

    if (detection.isSource && detection.confidence > 0.5) {
      // Case 1: Source detected in reference text - auto-split it
      const referenceLines = finalReference.trim().split('\n').filter(line => line.trim());
      const source = referenceLines[referenceLines.length - 1];
      const referenceContent = referenceLines.slice(0, -1).join('\n').trim();

      // Store this source for future use
      EditorState.updateLastSource(source);

      if (referenceContent) {
        finalContent = `<Note id="${currentNoteId}" time="${timestamp}">\n${content.trim()}\n///\n${referenceContent}\n///\n${source}\n</Note>`;
      } else {
        // Only source, no reference content
        finalContent = `<Note id="${currentNoteId}" time="${timestamp}">\n${content.trim()}\n///\n\n///\n${source}\n</Note>`;
      }
    } else {
      // Case 2: No source detected, has reference text - use fallback or [Null]
      const fallbackSource = EditorState.lastUsedSource || 'Source: [Null]';
      finalContent = `<Note id="${currentNoteId}" time="${timestamp}">\n${content.trim()}\n///\n${finalReference.trim()}\n///\n${fallbackSource}\n</Note>`;
    }
  } else {
    // Case 3: No reference text - don't add source section
    finalContent = `<Note id="${currentNoteId}" time="${timestamp}">\n${content.trim()}\n</Note>`;
  }

  // Disable submit button temporarily
  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = !shouldClear ? 'Saving...' : 'Committing...';
  submitBtn.disabled = true;

  try {
    let response;
    if (isEditMode) {
      // Update existing note
      response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.updateNote(currentNoteId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename,
          content: finalContent,
          noteId: currentNoteId
        })
      });
    } else {
      // Append new note
      const section = getCurrentSection();
      response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.append}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename,
          content: finalContent,
          section: section || undefined
        })
      });
    }

    const result = await response.json();

    if (result.success) {
      // Preserve current chapter and section selection
      const prevFilename = filename;
      const prevSection = getCurrentSection();

      if (isEditMode) {
        await UIFeedback.showMessage(`Note #${currentNoteId} updated successfully`, 'success');
        if (shouldClear) {
          clearEditorAndReset(true);
        }
      } else {
        await UIFeedback.showMessage('Content committed successfully', 'success');
        if (shouldClear) {
          clearEditorAndReset(false);
        }
      }

      // Refresh chapters and notes after successful commit while restoring selection
      await loadFiles();

      const fileSelect = document.getElementById('fileSelect');
      if (prevFilename) {
        // Restore chapter selection and load its notes/sections
        fileSelect.value = prevFilename;
        await loadNotesForChapter(prevFilename);
        await loadSections(prevFilename);
      }

      // Restore previous section selection if any
      if (prevSection) {
        setCurrentSection(prevSection);
      }

      // Handle note ID management based on clear behavior
      if (shouldClear) {
        // Clear mode: reset to append mode
        EditorState.currentNoteId = '';
        const noteIdSelect = document.getElementById('noteIdSelect');
        noteIdSelect.value = '';

        // Blur the content area
        const contentArea = document.getElementById('contentArea');
        contentArea.blur();
      } else {
        // No clear mode (Ctrl+S): ensure we're in edit mode for the current note
        if (!isEditMode && currentNoteId) {
          // We just created a new note, set it as selected for continued editing AFTER refresh
          const noteIdSelect = document.getElementById('noteIdSelect');
          noteIdSelect.value = `#${currentNoteId}`;
          EditorState.currentNoteId = currentNoteId;

          // Set original reference to preserve it for future edits
          EditorState.originalReference = reference;

          // Set UI to edit mode
          const referenceArea = document.getElementById('referenceArea');
          referenceArea.disabled = true;
          referenceArea.style.backgroundColor = '#ebe9e5';
          referenceArea.style.color = '#999';
        } else if (isEditMode && EditorState.currentNoteId) {
          // Already in edit mode, maintain the selection after refresh
          const noteIdSelect = document.getElementById('noteIdSelect');
          noteIdSelect.value = `#${EditorState.currentNoteId}`;

          // Ensure EditorState.originalReference is preserved
          EditorState.originalReference = EditorState.originalReference || reference;
        }
      }
    } else {
      await UIFeedback.showMessage(result.error || (isEditMode ? 'Failed to update' : 'Failed to commit'), 'error');
    }
  } catch (error) {
    await UIFeedback.showMessage('Network error, please try again', 'error');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// Load notes for selected chapter
export async function loadNotesForChapter(filename) {
  const noteIdSelect = document.getElementById('noteIdSelect');
  const dropdown = document.getElementById('noteIdDropdown');

  if (!filename) {
    EditorState.allNotes = [];
    noteIdSelect.value = '';
    noteIdSelect.placeholder = 'Note ID or search...';
    noteIdSelect.disabled = true;
    dropdown.classList.add('hidden');
    return;
  }

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.notes(filename)}`);
    const data = await response.json();

    if (data.notes && data.notes.length > 0) {
      EditorState.allNotes = data.notes.map(note => ({
        id: note.id,
        preview: note.preview,
        section: note.section,
        text: note.preview ? `#${note.id} - ${note.preview}` : `#${note.id}`
      }));
    } else {
      EditorState.allNotes = [];
    }

    // Always keep note field enabled
    noteIdSelect.disabled = false;
    noteIdSelect.placeholder = 'Note';
    noteIdSelect.value = '';
    dropdown.classList.add('hidden');
  } catch (error) {
    console.error('Failed to load notes for chapter:', error);
    EditorState.allNotes = [];
    noteIdSelect.disabled = false;
    noteIdSelect.placeholder = 'Note';
    dropdown.classList.add('hidden');
  }
}

// Load note by ID
export async function loadNoteById(noteId) {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.note(noteId)}`);
    if (!response.ok) {
      throw new Error('Note not found');
    }

    const data = await response.json();

    // Populate the form
    const fileSelect = document.getElementById('fileSelect');
    const contentArea = document.getElementById('contentArea');
    const referenceArea = document.getElementById('referenceArea');

    fileSelect.value = data.filename;
    contentArea.value = data.content;
    referenceArea.value = data.reference;

    // Store original reference for edit mode and current note ID
    EditorState.originalReference = data.reference || '';
    EditorState.currentNoteId = noteId;

    // Auto-resize textareas and update counter
    autoResize(contentArea);
    autoResize(referenceArea);
    updateSourceIndicator(referenceArea.value);
    updateCharacterCounter(contentArea, 'contentCounter');

    await UIFeedback.showMessage(`Loaded note #${noteId}`, 'success');

  } catch (error) {
    await UIFeedback.showMessage(`Failed to load note #${noteId}`, 'error');
  }
}

// Load most recent note across all chapters by checking time field
export async function loadMostRecentNote() {
  try {
    // Fetch all notes from all chapters
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.allNotes}`);
    const data = await response.json();

    if (!data.success || !data.notes || data.notes.length === 0) {
      await UIFeedback.showMessage('No notes found in any chapter', 'info');
      return;
    }

    // Filter notes that have a time field and sort by time (most recent first)
    const notesWithTime = data.notes.filter(note => note.time);

    if (notesWithTime.length === 0) {
      await UIFeedback.showMessage('No notes with timestamps found', 'info');
      return;
    }

    // Sort by time in descending order (most recent first)
    notesWithTime.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Get the most recent note
    const mostRecentNote = notesWithTime[0];

    // Switch to the chapter containing this note
    const fileSelect = document.getElementById('fileSelect');
    fileSelect.value = mostRecentNote.filename;

    // Load notes and sections for this chapter
    await loadNotesForChapter(mostRecentNote.filename);
    await loadSections(mostRecentNote.filename);

    // Set the section dropdown before loading the note
    if (mostRecentNote.section) {
      const sectionSelect = document.getElementById('section-select');
      if (sectionSelect) {
        sectionSelect.value = mostRecentNote.section;
        setCurrentSection(mostRecentNote.section);
      }
    }

    // Load the note itself
    await selectNote(mostRecentNote.id);

  } catch (error) {
    console.error('Error loading most recent note:', error);
    await UIFeedback.showMessage('Failed to load most recent note', 'error');
  }
}

// Filter and display notes based on search input
export function filterNotes(searchTerm) {
  const dropdown = document.getElementById('noteIdDropdown');

  if (EditorState.allNotes.length === 0) {
    dropdown.classList.add('hidden');
    return;
  }

  // Get currently selected section
  const currentSection = getCurrentSection();

  let filtered;
  if (!searchTerm.trim()) {
    // Show all notes when no search term, but filter by section
    filtered = EditorState.allNotes;
  } else {
    // Clean search term (remove # if present)
    const cleanSearchTerm = searchTerm.replace(/^#/, '').toLowerCase();

    // Filter based on search term
    filtered = EditorState.allNotes.filter(note =>
      note.id.toLowerCase().includes(cleanSearchTerm) ||
      (note.preview && note.preview.toLowerCase().includes(cleanSearchTerm))
    );
  }

  // Further filter by selected section if one is selected
  if (currentSection) {
    filtered = filtered.filter(note => note.section === currentSection);
  }

  if (filtered.length === 0) {
    dropdown.classList.add('hidden');
    return;
  }

  dropdown.innerHTML = filtered.map((note, index) =>
    `<div class="px-4 py-2.5 cursor-pointer text-xs font-normal leading-tight dropdown-item dropdown-item-natural ${index === 0 ? 'selected' : ''}" style="font-size: 10px; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: #78716c;" data-note-id="${note.id}" data-index="${index}">
      ${note.text}
    </div>`
  ).join('');

  EditorState.selectedDropdownIndex = 0;

  dropdown.classList.remove('hidden');
}

// Handle note selection from dropdown
export async function selectNote(noteId) {
  const noteIdSelect = document.getElementById('noteIdSelect');
  const dropdown = document.getElementById('noteIdDropdown');
  const referenceArea = document.getElementById('referenceArea');

  noteIdSelect.value = `#${noteId}`;
  dropdown.classList.add('hidden');

  // Set UI to edit mode and load the note
  referenceArea.disabled = true;
  referenceArea.style.backgroundColor = '#ebe9e5';
  referenceArea.style.color = '#999';
  await loadNoteById(noteId);
}
