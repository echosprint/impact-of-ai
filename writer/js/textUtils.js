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

  // Detect potential source in reference text (Harvard format only)
  detectSource: function(text) {
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return { isSource: false, confidence: 0, reason: '' };

    const lastLine = lines[lines.length - 1].trim();

    // Harvard citation format patterns (English and Chinese variants)
    // Key characteristic: Author(s) (Year) followed by title (NOT a period like APA)
    const harvardPatterns = [
      // English Harvard Format
      // Pattern: Author Name(s) (Year) 'Title' or "Title", Publisher/Source...
      // Note: Harvard uses (Year) NOT (Year). - that's APA format
      /^[A-Z][a-zA-Z\s,.-]+\(\d{4}\)\s*[''""].+/,                    // Author (2024) 'Title'...
      /^[A-Z][a-zA-Z\s,.-]+\(\d{4}\)\s+[^.].+/,                      // Author (2024) Title... (no period after year)

      // English with multiple authors (excluding APA's period after year)
      /^[A-Z][^(]+;\s*[A-Z][^(]+\(\d{4}\)\s*[^.]/,                  // Author1; Author2 (2024) [not .]
      /^[A-Z][^(]+,\s*[A-Z]\.\s*\(\d{4}\)\s*[^.]/,                  // Author, A. (2024) [not .]
      /^[A-Z][^(]+,\s*[A-Z][^(]+and\s+[A-Z][^(]+\(\d{4}\)\s*[^.]/,  // Author1, Author2 and Author3 (2024) [not .]

      // Chinese Harvard Format
      // Pattern: 作者名 (年份) 《书名》, 出版社
      /^[\u4e00-\u9fa5][^\(（]*[（(]\d{4}[)）]\s*[《"'].+/,           // 中文作者 (2024) 《标题》...
      /[\u4e00-\u9fa5][^\(（]*[（(]\d{4}[)）].*[《》]/,               // Contains Chinese author (year) ... 《书名》

      // Mixed format with Chinese and English
      /^[\u4e00-\u9fa5][^\(（]*[，,]\s*[A-Z][^(]*\(\d{4}\)/,         // 中文作者, English Name (2024)

      // Harvard with URL (common variant)
      // Pattern: Author (Year) ... Available at: URL or https://
      /^[A-Z][^(]+\(\d{4}\).*[Aa]vailable at:\s*https?:\/\//,      // Author (2024) ... Available at: URL
      /^[A-Z][^(]+\(\d{4}\).*https?:\/\//,                          // Author (2024) ... https://URL

      // Harvard with access date
      /^[A-Z][^(]+\(\d{4}\).*\([Aa]ccessed:\s*.+\)/,                // Author (2024) ... (Accessed: Date)
      /[\u4e00-\u9fa5][^\(（]*[（(]\d{4}[)）].*[（(]访问日期[:：]/,   // 作者 (2024) ... (访问日期: Date)

      // Harvard with publisher
      /^[A-Z][^(]+\(\d{4}\).*[,，]\s*[A-Z][^.]+\./,                 // Author (2024) ..., Publisher.
      /[\u4e00-\u9fa5][^\(（]*[（(]\d{4}[)）].*出版社/,               // 作者 (2024) ... 出版社
    ];

    for (const pattern of harvardPatterns) {
      if (pattern.test(lastLine)) {
        return {
          isSource: true,
          confidence: 0.95,
          reason: 'Harvard citation format detected'
        };
      }
    }

    return { isSource: false, confidence: 0, reason: 'No Harvard citation format detected' };
  }
};