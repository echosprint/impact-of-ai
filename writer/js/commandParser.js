import { API_CONFIG } from './config.js';
import { UIFeedback } from './uiFeedback.js';

/**
 * Parse and execute note move commands
 * Syntax: #noteId1 > #noteId2  (move noteId1 before noteId2)
 *         #noteId1 < #noteId2  (move noteId1 after noteId2)
 */

export const CommandParser = {
  /**
   * Parse a command string
   * @param {string} commandStr - Command string like "#45x8c > #4ds8c"
   * @returns {Object|null} Parsed command or null if invalid
   */
  parseCommand(commandStr) {
    const trimmed = commandStr.trim();

    // Match patterns: #noteId1 > #noteId2 or #noteId1 < #noteId2
    const moveBeforeMatch = trimmed.match(/^#?([a-zA-Z0-9]+)\s*>\s*#?([a-zA-Z0-9]+)$/);
    const moveAfterMatch = trimmed.match(/^#?([a-zA-Z0-9]+)\s*<\s*#?([a-zA-Z0-9]+)$/);

    if (moveBeforeMatch) {
      return {
        type: 'move',
        sourceNoteId: moveBeforeMatch[1],
        targetNoteId: moveBeforeMatch[2],
        position: 'before'
      };
    }

    if (moveAfterMatch) {
      return {
        type: 'move',
        sourceNoteId: moveAfterMatch[1],
        targetNoteId: moveAfterMatch[2],
        position: 'after'
      };
    }

    return null;
  },

  /**
   * Execute a parsed command
   * @param {Object} command - Parsed command object
   */
  async executeCommand(command) {
    if (!command) {
      await UIFeedback.showMessage('Invalid command format', 'error');
      return;
    }

    if (command.type === 'move') {
      await this.executeMoveCommand(command);
    }
  },

  /**
   * Execute a move command
   * @param {Object} command - Move command object
   */
  async executeMoveCommand(command) {
    const { sourceNoteId, targetNoteId, position } = command;

    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/api/move-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceNoteId,
          targetNoteId,
          position
        })
      });

      const result = await response.json();

      if (result.success) {
        const positionText = position === 'before' ? 'before' : 'after';
        await UIFeedback.showMessage(
          `Moved #${sourceNoteId} ${positionText} #${targetNoteId} in ${result.filename}`,
          'success'
        );
      } else {
        await UIFeedback.showMessage(result.error || 'Failed to move note', 'error');
      }
    } catch (error) {
      console.error('Move command error:', error);
      await UIFeedback.showMessage('Network error during move operation', 'error');
    }
  },

  /**
   * Check if a string is a valid command
   * @param {string} str - String to check
   * @returns {boolean}
   */
  isCommand(str) {
    return this.parseCommand(str) !== null;
  }
};
