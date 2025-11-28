// Editor State Management
export const EditorState = {
  isComposing: false,
  allNotes: [],
  selectedDropdownIndex: -1,
  originalReference: '',
  currentNoteId: '',
  currentSection: null,
  scrollTimeout: null,
  lastUsedSource: localStorage.getItem('lastUsedSource') || '',

  reset: function() {
    this.currentNoteId = '';
    this.originalReference = '';
    this.selectedDropdownIndex = -1;
    this.currentSection = null;
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  },

  setCurrentNote: function(noteId, reference) {
    this.currentNoteId = noteId;
    this.originalReference = reference || '';
  },

  updateLastSource: function(source) {
    this.lastUsedSource = source;
    localStorage.setItem('lastUsedSource', source);
  }
};

// Export as 'state' for convenience
export const state = EditorState;