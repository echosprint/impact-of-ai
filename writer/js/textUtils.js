// Text Processing Utilities
export const TextUtils = {
  countCharacters: function(text) {
    if (!text.trim()) return 0;

    let count = 0;
    // Split by whitespace to get potential English words
    const segments = text.trim().split(/\s+/);

    for (const segment of segments) {
      // For each segment, count Chinese characters individually and English words as 1
      let englishWord = '';
      for (const char of segment) {
        if (/[\u4e00-\u9fff]/.test(char)) {
          // Chinese character - count as 1 word
          if (englishWord) {
            count++; // Count accumulated English word
            englishWord = '';
          }
          count++; // Count Chinese character
        } else if (/[a-zA-Z0-9]/.test(char)) {
          // English letter or number - accumulate
          englishWord += char;
        } else {
          // Punctuation or other - end current English word
          if (englishWord) {
            count++;
            englishWord = '';
          }
        }
      }
      // Don't forget the last English word in segment
      if (englishWord) {
        count++;
      }
    }

    return count;
  },

  // Detect potential source in reference text
  detectSource: function(text) {
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return { isSource: false, confidence: 0, reason: '' };

    const lastLine = lines[lines.length - 1].trim();

    // Common bibliography format patterns
    const sourcePatterns = [
      // Explicit source indicators
      /^(Source|source|来源|出处)[：:]\s*.+/i,

      // APA Format - must start with capital letter or be very specific
      /^[A-Z][a-zA-Z\s,.-]+\(\d{4}\)\./,                    // Author, A. (2024). Title
      /^\(\d{4}\)\.\s+[A-Z].+/,                             // (2024). Title (at start of line)

      // MLA Format
      /^[A-Z][a-zA-Z\s,.-]+".+"\s+.+\d{4}$/,              // Author. "Title" Publication 2024

      // Chinese Bibliography Format
      /.*《.+》.*\d{4}/,                                    // 《书名》... 2019
      /.*ISBN[\s:-]*[\dXx-]+/i,                            // ISBN number
      /.*出版社.*\d{4}/,                                    // Chinese publisher with year

      // URLs and DOIs (most reliable)
      /^https?:\/\/.+/,                                    // Direct URL
      /.*doi:\s*10\.\d+/i                                  // DOI
    ];

    for (const pattern of sourcePatterns) {
      if (pattern.test(lastLine)) {
        return {
          isSource: true,
          confidence: 0.95,
          reason: 'Bibliography format detected'
        };
      }
    }

    return { isSource: false, confidence: 0, reason: 'No citation format detected' };
  }
};