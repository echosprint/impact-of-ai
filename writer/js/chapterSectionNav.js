import { API_CONFIG } from './config.js';
import { loadSections, setCurrentSection } from './sectionManager.js';
import { loadNotesForChapter } from './noteManager.js';

// Navigation state management
export const NavState = {
  isNavModalOpen: false,
  currentLevel: 'chapters', // 'chapters' or 'sections'
  chapters: [], // Array of { name, chapterNumber }
  sections: [],
  selectedChapters: [], // Multiple chapters can share one numeric shortcut
  sectionsByChapter: [], // Sections grouped by chapter: [{chapter, sections}]
  shortcuts: '123456789abcdefghijklmnopqrstuvwxyz', // Start from 1-9 for sections, then letters
  chapterShortcutMap: {}, // Maps numeric shortcut key to array of chapter names
  sectionChapterMap: {} // Maps section to its chapter
};

// Generate shortcut key for section - just use next available letter starting from 'a'
function getShortcutForSection(usedShortcuts) {
  // Find first available letter from a, b, c, d...
  const availableKeys = NavState.shortcuts.split('');
  for (const key of availableKeys) {
    if (!usedShortcuts.has(key)) {
      return key;
    }
  }

  // Fallback: use double letters if we run out (unlikely)
  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 26; j++) {
      const key = NavState.shortcuts[i] + NavState.shortcuts[j];
      if (!usedShortcuts.has(key)) {
        return key;
      }
    }
  }

  return 'zz'; // Ultimate fallback
}

// Show chapter/section navigation modal
export function showNavModal() {
  const modal = document.getElementById('navModal');

  if (modal) {
    NavState.isNavModalOpen = true;
    NavState.currentLevel = 'chapters';
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');

    // Load and display chapters
    loadChapters();
  }
}

// Hide navigation modal
export function hideNavModal() {
  const modal = document.getElementById('navModal');

  if (modal) {
    NavState.isNavModalOpen = false;
    NavState.currentLevel = 'chapters';
    NavState.selectedChapters = [];
    NavState.sectionsByChapter = [];
    modal.classList.add('opacity-0', 'pointer-events-none');
    modal.classList.remove('opacity-100', 'pointer-events-auto');

    clearNavContent();
  }
}

// Clear navigation content
function clearNavContent() {
  const titleElement = document.getElementById('navTitle');
  const contentElement = document.getElementById('navContent');

  if (titleElement) {
    titleElement.textContent = '';
  }
  if (contentElement) {
    contentElement.innerHTML = '';
  }
}

// Load chapters from API
async function loadChapters() {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.files}`);
    const data = await response.json();

    // data.files is now an array of { name, shortcut } objects
    NavState.chapters = data.files || [];
    displayChapters();
  } catch (error) {
    console.error('Failed to load chapters:', error);
    NavState.chapters = [];
    displayChapters();
  }
}

// Display chapters in modal
function displayChapters() {
  const titleElement = document.getElementById('navTitle');
  const contentElement = document.getElementById('navContent');

  if (!titleElement || !contentElement) return;

  titleElement.textContent = 'Select Chapter';

  if (NavState.chapters.length === 0) {
    contentElement.innerHTML = '<div class="text-center text-gray-500 py-4">No chapters found</div>';
    return;
  }

  // Build shortcut map using shortcuts from chapter data
  NavState.chapterShortcutMap = {};

  const chaptersHTML = NavState.chapters.map((chapterData, index) => {
    const chapterName = chapterData.name;
    const chapterNumber = chapterData.chapterNumber;

    // Store mapping for chapter numbers only (no letter shortcuts)
    // 1-9: Direct number keys
    // 10-19: Shift+0 through Shift+9
    if (chapterNumber !== null && chapterNumber !== undefined) {
      if (chapterNumber >= 1 && chapterNumber <= 9) {
        // Single digit: use number key directly
        const numKey = chapterNumber.toString();
        if (!NavState.chapterShortcutMap[numKey]) {
          NavState.chapterShortcutMap[numKey] = [];
        }
        NavState.chapterShortcutMap[numKey].push(chapterName);
      } else if (chapterNumber >= 10 && chapterNumber <= 19) {
        // 10-19: use Shift+digit (10=Shift+0, 11=Shift+1, etc.)
        const shiftKey = `shift+${chapterNumber - 10}`;
        if (!NavState.chapterShortcutMap[shiftKey]) {
          NavState.chapterShortcutMap[shiftKey] = [];
        }
        NavState.chapterShortcutMap[shiftKey].push(chapterName);
      }
    }

    const displayName = chapterName.replace(/\.(md|mdx)$/, '');

    // Build shortcut display based on chapter number (numeric only)
    let shortcutDisplay = '';
    if (chapterNumber !== null && chapterNumber !== undefined) {
      if (chapterNumber >= 1 && chapterNumber <= 9) {
        shortcutDisplay = `<kbd class="nav-shortcut px-1.5 py-0.5 rounded">${chapterNumber}</kbd>`;
      } else if (chapterNumber >= 10 && chapterNumber <= 19) {
        shortcutDisplay = `<kbd class="nav-shortcut px-1.5 py-0.5 rounded">⇧${chapterNumber - 10}</kbd>`;
      }
    }

    return `
      <div class="nav-item rounded cursor-pointer transition-colors"
           data-chapter="${chapterName}"
           data-chapter-number="${chapterNumber || ''}"
           data-index="${index}">
        <div class="flex items-center justify-between gap-2">
          <div class="flex-1 text-xs truncate">${displayName}</div>
          ${shortcutDisplay ? `<div class="flex gap-1">${shortcutDisplay}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  contentElement.innerHTML = chaptersHTML;

  // Add click handlers
  contentElement.querySelectorAll('.nav-item').forEach(element => {
    element.addEventListener('click', () => {
      const chapter = element.getAttribute('data-chapter');
      selectChapters([chapter]);
    });
  });
}

// Select chapters (can be multiple if they share a shortcut) and show all their sections
async function selectChapters(chapters) {
  NavState.selectedChapters = chapters;
  NavState.currentLevel = 'sections';

  // Load sections for all selected chapters, organized by chapter
  try {
    const sectionsByChapter = [];
    NavState.sectionChapterMap = {};

    for (const chapter of chapters) {
      const response = await fetch(`/api/sections/${encodeURIComponent(chapter)}`);
      const data = await response.json();
      const sections = data.sections || [];

      // Track which chapter each section belongs to
      sections.forEach(section => {
        NavState.sectionChapterMap[section] = chapter;
      });

      // Store sections grouped by chapter
      sectionsByChapter.push({
        chapter,
        sections
      });
    }

    NavState.sectionsByChapter = sectionsByChapter;
    displaySections();
  } catch (error) {
    console.error('Failed to load sections:', error);
    NavState.sectionsByChapter = [];
    displaySections();
  }
}

// Display sections in modal
function displaySections() {
  const titleElement = document.getElementById('navTitle');
  const contentElement = document.getElementById('navContent');

  if (!titleElement || !contentElement) return;

  // Show title
  titleElement.innerHTML = `
    <div class="flex items-center gap-2">
      <button class="nav-back-btn text-gray-500 hover:text-gray-700 transition-colors" title="Back to chapters">
        ←
      </button>
      <span class="text-xs">Select Section</span>
    </div>
  `;

  // Add back button handler
  const backBtn = titleElement.querySelector('.nav-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      NavState.currentLevel = 'chapters';
      displayChapters();
    });
  }

  if (!NavState.sectionsByChapter || NavState.sectionsByChapter.length === 0) {
    contentElement.innerHTML = '<div class="text-center text-gray-500 py-4">No sections found</div>';
    return;
  }

  // Track used shortcuts globally across all chapters
  const usedShortcuts = new Set();
  let sectionsHTML = '';

  // Generate HTML for each chapter group
  NavState.sectionsByChapter.forEach(({ chapter, sections }) => {
    if (sections.length === 0) return;

    const chapterName = chapter.replace(/\.(md|mdx)$/, '');

    // Add chapter header (only if multiple chapters)
    if (NavState.sectionsByChapter.length > 1) {
      sectionsHTML += `
        <div class="nav-chapter-header">
          ${chapterName}
        </div>
      `;
    }

    // Add sections for this chapter
    sections.forEach((section) => {
      const shortcut = getShortcutForSection(usedShortcuts);
      usedShortcuts.add(shortcut);

      sectionsHTML += `
        <div class="nav-item rounded cursor-pointer transition-colors"
             data-section="${section}"
             data-shortcut="${shortcut}">
          <div class="flex items-center justify-between gap-2">
            <div class="flex-1 text-xs truncate">${section}</div>
            <kbd class="nav-shortcut px-1.5 py-0.5 rounded">${shortcut}</kbd>
          </div>
        </div>
      `;
    });
  });

  contentElement.innerHTML = sectionsHTML;

  // Add click handlers
  contentElement.querySelectorAll('.nav-item').forEach(element => {
    element.addEventListener('click', () => {
      const section = element.getAttribute('data-section');
      // Select section without moving focus to content area
      selectSection(section);
    });
  });
}

// Select a section and apply to dropdowns (no auto-focus on content area)
async function selectSection(section) {
  // Get the chapter for this section
  const chapter = NavState.sectionChapterMap[section];
  if (!chapter) return;

  // Hide modal immediately
  hideNavModal();

  try {
    // Set chapter dropdown
    const fileSelect = document.getElementById('fileSelect');
    if (fileSelect) {
      fileSelect.value = chapter;

      // Trigger change event to load notes
      const changeEvent = new Event('change', { bubbles: true });
      fileSelect.dispatchEvent(changeEvent);

      // Load sections for this chapter
      await loadNotesForChapter(chapter);
      await loadSections(chapter);

      // Wait a moment for sections to populate, then set section
      setTimeout(() => {
        setCurrentSection(section);
      }, 200);
    }
  } catch (error) {
    console.error('Failed to select chapter/section:', error);
  }
}

// Handle keyboard navigation
export function handleNavKeypress(event) {
  if (!NavState.isNavModalOpen) return false;

  const key = event.key;
  const code = event.code;
  const shiftKey = event.shiftKey;

  // Escape to close
  if (key === 'Escape') {
    hideNavModal();
    return true;
  }

  // Backspace to go back to chapters from sections
  if (key === 'Backspace' && NavState.currentLevel === 'sections') {
    NavState.currentLevel = 'chapters';
    displayChapters();
    return true;
  }

  // Handle shortcut key press
  const keyLower = key.toLowerCase();

  if (NavState.currentLevel === 'chapters') {
    let lookupKey = keyLower;

    // Check for Shift+number combinations (for chapters 10-19)
    // Use event.code to get physical key (Digit0-Digit9) regardless of Shift
    if (shiftKey && code && code.match(/^Digit[0-9]$/)) {
      const digit = code.replace('Digit', '');
      lookupKey = `shift+${digit}`;
    }

    // Check if this key maps to any chapters
    const chapters = NavState.chapterShortcutMap[lookupKey];
    if (chapters && chapters.length > 0) {
      selectChapters(chapters);
      return true;
    }
  } else {
    // Section level navigation
    let lookupKey = keyLower;

    // For digits without Shift, use the digit directly
    if (!shiftKey && code && code.match(/^Digit[0-9]$/)) {
      const digit = code.replace('Digit', '');
      lookupKey = digit;
    }

    // Find section with matching shortcut
    const items = document.querySelectorAll('.nav-item');
    for (const item of items) {
      const shortcut = item.getAttribute('data-shortcut');
      if (shortcut === lookupKey) {
        const section = item.getAttribute('data-section');
        // Keyboard shortcut selection: select section without focusing content area
        selectSection(section);
        return true;
      }
    }
  }

  return false;
}

// Initialize navigation modal
export function initializeNavModal() {
  const modal = document.getElementById('navModal');

  // Click outside to close
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideNavModal();
      }
    });
  }
}
