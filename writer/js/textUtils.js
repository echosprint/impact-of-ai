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

    // Comprehensive bibliography format patterns
    const sourcePatterns = [
      // Explicit source indicators
      /^(Source|source|来源|出处|作者)[：:]\s*.+/i,

      // APA Format
      /^[A-Z][a-zA-Z\s,.-]+\(\d{4}\)\./,                    // Author, A. (2024). Title
      /.*\(\d{4}\)\.\s*.+\.\s*Journal/i,                    // (2024). Title. Journal
      /.*\(\d{4},\s*[A-Z][a-z]+\s+\d{1,2}\)\./,           // (2024, March 15).

      // MLA Format
      /^[A-Z][a-zA-Z\s,.-]+".+"\s+.+\d{4}/,               // Author. "Title" Publication 2024
      /.*Web\.\s+\d{1,2}\s+[A-Z][a-z]+\s+\d{4}/i,        // Web. 15 March 2024

      // Chicago Style
      /.*\d{4}\):\s*\d+[-–]\d+\./,                         // 2024): 123-145.
      /.*\d{4}\.\s*https?:\/\/.+/,                         // 2024. http://...

      // Harvard Style
      /^[A-Z][a-zA-Z\s,.-]+\d{4},\s*'.+'.*$/,             // Author 2024, 'Title'

      // Vancouver Style (Numbered)
      /^\d+\.\s+[A-Z][a-zA-Z\s,.-]+\d{4}/,                // 1. Author 2024

      // Chinese Academic Formats
      /.*《.+》.*\d{4}/,                                    // 《书名》作者 2024
      /.*［M］.*\d{4}/,                                     // [M] 2024 (Chinese monograph)
      /.*［J］.*\d{4}/,                                     // [J] 2024 (Chinese journal)
      /.*［N］.*\d{4}/,                                     // [N] 2024 (Chinese newspaper)
      /.*［D］.*\d{4}/,                                     // [D] 2024 (Chinese dissertation)
      /.*［R］.*\d{4}/,                                     // [R] 2024 (Chinese report)
      /.*［P］.*\d{4}/,                                     // [P] 2024 (Chinese patent)
      /.*［S］.*\d{4}/,                                     // [S] 2024 (Chinese standard)
      /.*［EB\/OL］.*\d{4}/,                               // [EB/OL] 2024 (Chinese online)

      // General Academic Patterns
      /.*,\s*vol\.\s*\d+.*\d{4}/i,                        // vol. 15, 2024
      /.*,\s*no\.\s*\d+.*\d{4}/i,                         // no. 3, 2024
      /.*,\s*pp?\.\s*\d+[-–]\d+/i,                        // pp. 123-145
      /.*,\s*p\.\s*\d+/i,                                  // p. 123

      // DOI and URLs
      /.*doi:\s*10\.\d+/i,                                 // DOI
      /.*DOI:\s*https?:\/\/doi\.org/i,                     // DOI URL
      /^https?:\/\/.+/,                                    // Direct URL

      // ISBN and ISSN
      /.*ISBN[\s:-]*\d{3}[-\s]?\d{1}[-\s]?\d{3}[-\s]?\d{5}[-\s]?\d{1}/i, // ISBN
      /.*ISSN[\s:-]*\d{4}[-\s]?\d{4}/i,                   // ISSN

      // Publishers
      /.*\b(University\s+Press|Cambridge|Oxford|MIT\s+Press|Springer|Elsevier|Wiley|Academic\s+Press|Norton|Penguin|Random\s+House)\b.*\d{4}/i,
      /.*出版社.*\d{4}/,                                    // Chinese publishers

      // Thesis/Dissertation
      /.*\b(PhD|Master[''']?s?|Dissertation|Thesis)\b.*\d{4}/i,
      /.*硕士学位论文.*\d{4}/,                              // Chinese Master's thesis
      /.*博士学位论文.*\d{4}/,                              // Chinese PhD thesis

      // Conference Proceedings
      /.*\b(Proceedings?|Conference|Symposium|Workshop)\b.*\d{4}/i,
      /.*会议论文.*\d{4}/,                                  // Chinese conference

      // News Articles
      /.*\b(The\s+)?(New\s+York\s+Times|Washington\s+Post|Wall\s+Street\s+Journal|Guardian|BBC|CNN|Reuters)\b.*\d{4}/i,
      /.*人民日报.*\d{4}/,                                  // People's Daily
      /.*新华社.*\d{4}/,                                    // Xinhua

      // Government Documents
      /.*\b(Government|Ministry|Department|Bureau|Agency|Commission)\b.*\d{4}/i,
      /.*政府.*\d{4}/,                                      // Government (Chinese)

      // Legal Documents
      /.*\b(Act|Law|Regulation|Code|Constitution|Treaty|Convention)\b.*\d{4}/i,
      /.*法.*\d{4}/,                                        // Law (Chinese)

      // Date formats at end
      /.*\b\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/,               // MM/DD/YYYY or DD/MM/YYYY
      /.*\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/,               // YYYY/MM/DD
      /.*\b[A-Z][a-z]+\s+\d{1,2},\s+\d{4}$/,             // March 15, 2024
      /.*\b\d{1,2}\s+[A-Z][a-z]+\s+\d{4}$/               // 15 March 2024
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

    // Additional heuristics for edge cases
    if (lastLine.includes('：') || lastLine.includes(':')) {
      return { isSource: true, confidence: 0.7, reason: 'Contains colon separator' };
    }

    // Year at end of line
    if (/\b(19|20)\d{2}\b/.test(lastLine.slice(-20))) {
      return { isSource: true, confidence: 0.6, reason: 'Ends with year' };
    }

    // Short concluding line (likely citation)
    if (lastLine.length < 30 && lines.length > 2) {
      return { isSource: true, confidence: 0.4, reason: 'Short final line' };
    }

    return { isSource: false, confidence: 0, reason: 'No citation format detected' };
  }
};