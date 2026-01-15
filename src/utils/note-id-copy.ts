/**
 * Note ID copy functionality
 * Handles click-to-copy for note ID labels
 */

/**
 * Setup click handlers for all note ID labels
 */
export function setupNoteIdCopy(): void {
  const noteIdLabels = document.querySelectorAll('.note-id-label');

  noteIdLabels.forEach((label) => {
    // Remove existing listener if any to prevent duplicates
    const element = label as HTMLElement;
    element.removeEventListener('click', handleNoteIdClick);
    // Add click listener
    element.addEventListener('click', handleNoteIdClick);
  });
}

/**
 * Handle click event on note ID label
 */
async function handleNoteIdClick(event: Event): Promise<void> {
  event.stopPropagation(); // Prevent triggering parent note click

  const label = event.currentTarget as HTMLElement;
  const noteIdText = label.textContent || '';
  const noteIdWithHash = noteIdText.trim(); // Keep the # prefix

  if (!noteIdWithHash) return;

  try {
    // Copy to clipboard with # prefix
    await navigator.clipboard.writeText(noteIdWithHash);
    triggerCopyAnimation(label);
  } catch (err) {
    console.error('Failed to copy note ID:', err);
    // Fallback for older browsers or permission issues
    fallbackCopy(noteIdWithHash);
    triggerCopyAnimation(label);
  }
}

/**
 * Trigger visual animation on the note ID label when copied
 */
function triggerCopyAnimation(labelElement: HTMLElement): void {
  // Add animation class
  labelElement.classList.add('note-id-copied');

  // Remove animation class after animation completes
  setTimeout(() => {
    labelElement.classList.remove('note-id-copied');
  }, 600); // Match CSS animation duration
}

/**
 * Fallback copy method for older browsers
 */
function fallbackCopy(text: string): void {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }

  document.body.removeChild(textArea);
}

/**
 * Initialize note ID copy functionality
 */
export function initializeNoteIdCopy(): void {
  // Setup on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNoteIdCopy);
  } else {
    setupNoteIdCopy();
  }

  // Watch for dynamically added notes
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      const hasNewNotes = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some(
          (node) =>
            node instanceof Element &&
            (node.classList.contains('note-id-label') ||
              node.querySelector('.note-id-label'))
        )
      );

      if (hasNewNotes) {
        setupNoteIdCopy();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}
