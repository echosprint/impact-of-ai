// sectionManager.js - Handles section selection and state

import { UIFeedback } from './uiFeedback.js';
import { state } from './editorState.js';

/**
 * Load sections for the given filename
 */
export async function loadSections(filename) {
  if (!filename) {
    populateSectionDropdown([]);
    return;
  }

  try {
    const response = await fetch(`/api/sections/${encodeURIComponent(filename)}`);

    if (!response.ok) {
      throw new Error(`Failed to load sections: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Sections loaded:', data.sections);

    if (data.success && data.sections) {
      populateSectionDropdown(data.sections);
      console.log('Section dropdown populated with', data.sections.length, 'sections');
      return data.sections;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error loading sections:', error);
    UIFeedback.showMessage('Failed to load sections', 'error');
    populateSectionDropdown([]);
    return [];
  }
}

/**
 * Populate the section dropdown with sections
 */
function populateSectionDropdown(sections) {
  const sectionSelect = document.getElementById('section-select');

  if (!sectionSelect) {
    console.warn('Section select element not found');
    return;
  }

  // Clear existing options except the first placeholder
  sectionSelect.innerHTML = '<option value="">Sections...</option>';

  // Add section options
  sections.forEach(section => {
    const option = document.createElement('option');
    option.value = section;
    option.textContent = section;
    sectionSelect.appendChild(option);
  });

  // Reset selection
  sectionSelect.value = '';
  state.currentSection = null;
}

/**
 * Get the currently selected section
 */
export function getCurrentSection() {
  const sectionSelect = document.getElementById('section-select');
  return sectionSelect?.value || null;
}

/**
 * Set the current section
 */
export function setCurrentSection(section) {
  const sectionSelect = document.getElementById('section-select');
  if (sectionSelect) {
    sectionSelect.value = section || '';
    state.currentSection = section || null;
  }
}

/**
 * Clear section selection
 */
export function clearSectionSelection() {
  setCurrentSection(null);
}
