// UI Feedback System
export const UIFeedback = {
  isMessageShowing: false,

  showMessage: async function(text, type, duration) {
    const messageEl = document.getElementById('message');

    // Prevent multiple simultaneous messages
    if (this.isMessageShowing) {
      return;
    }

    // Set message showing state
    this.isMessageShowing = true;

    messageEl.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-full shadow-md transition-all duration-300 text-xs ${
      type === 'success'
        ? 'bg-green-600 text-white'
        : 'bg-orange-100 text-orange-800 border border-orange-200'
    }`;
    messageEl.textContent = text;
    messageEl.style.opacity = '1';
    messageEl.style.pointerEvents = 'auto';

    // Auto-hide after delay
    const hideDelay = duration || (type === 'error' ? 4000 : 2000);
    await new Promise(resolve => setTimeout(resolve, hideDelay));

    messageEl.style.opacity = '0';
    messageEl.style.pointerEvents = 'none';

    // Reset message showing state after animation
    setTimeout(() => {
      this.isMessageShowing = false;
    }, 300);
  }
};

// Shortcut helper modal functions
export function showShortcutHelper() {
  const helper = document.getElementById('shortcutHelper');
  helper.style.opacity = '1';
  helper.style.pointerEvents = 'auto';
}

export function hideShortcutHelper() {
  const helper = document.getElementById('shortcutHelper');
  helper.style.opacity = '0';
  helper.style.pointerEvents = 'none';
}