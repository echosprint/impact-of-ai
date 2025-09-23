import { autoResize } from './textareaManager.js';

// Theme management
export function toggleDarkTheme() {
  document.body.classList.toggle('dark-theme');
  // Save theme preference to localStorage
  const isDark = document.body.classList.contains('dark-theme');
  localStorage.setItem('editor-theme', isDark ? 'dark' : 'light');
}

// Toggle quotes area visibility
export function toggleQuotesArea() {
  const referenceContainer = document.querySelector('.relative:has(#referenceArea)');
  const contentArea = document.getElementById('contentArea');

  if (referenceContainer && contentArea) {
    const isHidden = referenceContainer.style.display === 'none';

    if (isHidden) {
      // Show quotes area and restore content area height
      referenceContainer.style.display = '';
      contentArea.style.minHeight = '200px';
    } else {
      // Hide quotes area and expand content area
      referenceContainer.style.display = 'none';
      contentArea.style.minHeight = '400px';
    }

    // Auto-resize content area to fit current content
    autoResize(contentArea);

    // Save state to localStorage
    localStorage.setItem('quotesAreaHidden', !isHidden);
  }
}

// Load saved theme on page load
export function loadSavedTheme() {
  const savedTheme = localStorage.getItem('editor-theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }
}

// Load saved quotes area visibility state
export function loadSavedQuotesAreaState() {
  const quotesHidden = localStorage.getItem('quotesAreaHidden') === 'true';
  const referenceContainer = document.querySelector('.relative:has(#referenceArea)');
  const contentArea = document.getElementById('contentArea');

  if (quotesHidden && referenceContainer && contentArea) {
    // Hide quotes area and expand content area
    referenceContainer.style.display = 'none';
    contentArea.style.minHeight = '400px';
  } else if (contentArea) {
    // Ensure normal height when quotes area is visible
    contentArea.style.minHeight = '200px';
  }
}