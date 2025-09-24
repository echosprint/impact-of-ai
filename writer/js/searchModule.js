import { API_CONFIG } from './config.js';
import { selectNote } from './noteManager.js';

// Search state management
export const SearchState = {
  searchResults: [],
  selectedIndex: -1,
  isSearchModalOpen: false
};

// Show search modal
export function showSearchModal() {
  const modal = document.getElementById('searchModal');
  const searchInput = document.getElementById('searchInput');

  if (modal && searchInput) {
    SearchState.isSearchModalOpen = true;
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');

    // Focus the search input
    setTimeout(() => {
      searchInput.focus();
      searchInput.value = '';
      clearSearchResults();
    }, 100);
  }
}

// Hide search modal
export function hideSearchModal() {
  const modal = document.getElementById('searchModal');

  if (modal) {
    SearchState.isSearchModalOpen = false;
    modal.classList.add('opacity-0', 'pointer-events-none');
    modal.classList.remove('opacity-100', 'pointer-events-auto');

    // Reset state
    SearchState.selectedIndex = -1;
    SearchState.searchResults = [];
    clearSearchResults();
  }
}

// Clear search results display
function clearSearchResults() {
  const resultsContainer = document.getElementById('searchResults');
  if (resultsContainer) {
    resultsContainer.innerHTML = '';
  }
}

// Search notes across all files using server endpoint
export async function searchNotes(query) {
  if (!query.trim()) {
    clearSearchResults();
    return;
  }

  try {
    // Use server search endpoint
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.search(query)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Search request failed');
    }

    // Transform server results to match expected client format
    const transformedResults = data.results.map(result => ({
      id: result.noteId,
      filename: result.filename,
      preview: result.preview,
      highlightedPreview: result.highlightedPreview
    }));

    SearchState.searchResults = transformedResults;
    SearchState.selectedIndex = transformedResults.length > 0 ? 0 : -1; // Auto-select first result
    displaySearchResults(SearchState.searchResults);

  } catch (error) {
    console.error('Search failed:', error);
    displaySearchResults([]);
  }
}

// Display search results
function displaySearchResults(results) {
  const resultsContainer = document.getElementById('searchResults');
  if (!resultsContainer) return;

  if (results.length === 0) {
    resultsContainer.innerHTML = '';
    return;
  }

  const resultsHTML = results.map((result, index) => `
    <div class="search-result p-3 rounded-lg cursor-pointer transition-colors ${index === SearchState.selectedIndex ? 'selected' : ''}"
         data-note-id="${result.id}"
         data-filename="${result.filename}"
         data-index="${index}">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="text-xs font-medium mb-1 note-id">
            #${result.id} • ${result.filename.replace(/\.(md|mdx)$/, '')}
          </div>
          <div class="text-sm leading-relaxed">
            ${result.highlightedPreview}
          </div>
        </div>
      </div>
    </div>
  `).join('');

  resultsContainer.innerHTML = resultsHTML;

  // Add click handlers to results
  resultsContainer.querySelectorAll('.search-result').forEach(element => {
    element.addEventListener('click', () => {
      const noteId = element.getAttribute('data-note-id');
      const filename = element.getAttribute('data-filename');
      selectSearchResult(noteId, filename);
    });
  });
}

// Handle result selection (Enter key or click)
export async function selectSearchResult(noteId, filename) {
  if (!noteId || !filename) return;

  // Hide modal instantly
  hideSearchModal();

  try {
    // Set the file select dropdown
    const fileSelect = document.getElementById('fileSelect');
    if (fileSelect) {
      fileSelect.value = filename;

      // Trigger change event to load notes for this file
      const changeEvent = new Event('change', { bubbles: true });
      fileSelect.dispatchEvent(changeEvent);

      // Wait a moment for notes to load, then select the note
      setTimeout(async () => {
        await selectNote(noteId);
      }, 300);
    }
  } catch (error) {
    console.error('Failed to select search result:', error);
  }
}

// Navigate search results with arrow keys
export function navigateSearchResults(direction) {
  if (SearchState.searchResults.length === 0) return;

  const previousIndex = SearchState.selectedIndex;

  if (direction === 'down') {
    if (SearchState.selectedIndex === -1) {
      SearchState.selectedIndex = 0; // Start from first item
    } else {
      SearchState.selectedIndex = Math.min(SearchState.selectedIndex + 1, SearchState.searchResults.length - 1);
    }
  } else if (direction === 'up') {
    if (SearchState.selectedIndex === -1) {
      SearchState.selectedIndex = SearchState.searchResults.length - 1; // Wrap to last item
    } else {
      SearchState.selectedIndex = Math.max(SearchState.selectedIndex - 1, 0); // Stay at first item
    }
  }

  if (SearchState.selectedIndex !== previousIndex) {
    displaySearchResults(SearchState.searchResults);
  }
}

// Select currently highlighted result
export function selectCurrentResult() {
  if (SearchState.selectedIndex >= 0 && SearchState.selectedIndex < SearchState.searchResults.length) {
    const result = SearchState.searchResults[SearchState.selectedIndex];
    selectSearchResult(result.id, result.filename);
  }
}

// Initialize search modal event handlers
export function initializeSearchModal() {
  const searchInput = document.getElementById('searchInput');
  const modal = document.getElementById('searchModal');

  // Search input handler with debouncing
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
          SearchState.selectedIndex = -1; // Reset selection on new search
          searchNotes(query);
        } else {
          clearSearchResults();
        }
      }, 300);
    });

    // Handle keyboard navigation in search input
    searchInput.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (SearchState.selectedIndex === -1) {
            SearchState.selectedIndex = 0;
          } else {
            navigateSearchResults('down');
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          navigateSearchResults('up');
          break;
        case 'Enter':
          e.preventDefault();
          selectCurrentResult();
          break;
        case 'Escape':
          e.preventDefault();
          hideSearchModal();
          break;
      }
    });
  }

  // Click outside to close
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideSearchModal();
      }
    });
  }
}