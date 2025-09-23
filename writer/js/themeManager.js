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
  const mainContainer = document.querySelector('main');

  if (referenceContainer && contentArea) {
    const isHidden = referenceContainer.style.display === 'none' ||
                     referenceContainer.style.opacity === '0';

    // Add transition styles if not already present
    if (!referenceContainer.style.transition) {
      referenceContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      contentArea.style.transition = 'min-height 0.3s ease';
    }

    // Prevent scrollbars during animation only if content doesn't already need scrolling
    const originalMainOverflow = mainContainer ? mainContainer.style.overflowY : '';
    const originalBodyOverflow = document.body.style.overflow;

    // Only hide main overflow if it's not currently needed for scrolling
    const mainNeedsScroll = mainContainer && mainContainer.scrollHeight > mainContainer.clientHeight;
    const bodyNeedsScroll = document.body.scrollHeight > window.innerHeight;

    if (mainContainer && !mainNeedsScroll) {
      mainContainer.style.overflowY = 'hidden';
    }
    if (!bodyNeedsScroll) {
      document.body.style.overflow = 'hidden';
    }

    if (isHidden) {
      // Show quotes area with animation
      referenceContainer.style.display = '';
      referenceContainer.style.opacity = '0';
      referenceContainer.style.transform = 'translateY(-10px)';
      referenceContainer.style.overflow = 'hidden';

      // Trigger animation after display is set
      requestAnimationFrame(() => {
        referenceContainer.style.opacity = '1';
        referenceContainer.style.transform = 'translateY(0)';
        contentArea.style.minHeight = '200px';

        // Restore overflow after animation
        setTimeout(() => {
          referenceContainer.style.overflow = '';
          // Restore main container and body overflow only if we changed them
          if (mainContainer && !mainNeedsScroll) {
            mainContainer.style.overflowY = originalMainOverflow;
          }
          if (!bodyNeedsScroll) {
            document.body.style.overflow = originalBodyOverflow;
          }
        }, 300);
      });
    } else {
      // Hide quotes area with animation
      referenceContainer.style.overflow = 'hidden';
      referenceContainer.style.opacity = '0';
      referenceContainer.style.transform = 'translateY(-10px)';
      contentArea.style.minHeight = '400px';

      // Hide after animation completes
      setTimeout(() => {
        referenceContainer.style.display = 'none';
        referenceContainer.style.overflow = '';
        // Restore main container and body overflow only if we changed them
        if (mainContainer && !mainNeedsScroll) {
          mainContainer.style.overflowY = originalMainOverflow;
        }
        if (!bodyNeedsScroll) {
          document.body.style.overflow = originalBodyOverflow;
        }
      }, 300);
    }

    // Auto-resize content area to fit current content after animation
    setTimeout(() => {
      autoResize(contentArea);
    }, 300);

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
    // Hide quotes area and expand content area (without animation on load)
    referenceContainer.style.display = 'none';
    referenceContainer.style.opacity = '0';
    contentArea.style.minHeight = '400px';
  } else if (contentArea) {
    // Ensure normal height when quotes area is visible
    contentArea.style.minHeight = '200px';
    if (referenceContainer) {
      referenceContainer.style.opacity = '1';
      referenceContainer.style.transform = 'translateY(0)';
    }
  }
}