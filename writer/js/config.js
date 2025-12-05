// API Configuration
export const API_CONFIG = {
  baseUrl: 'http://localhost:3001',
  endpoints: {
    notes: (filename) => `/api/notes/${filename}`,
    note: (id) => `/api/note/${id}`,
    updateNote: (id) => `/api/note/${id}`,
    append: '/api/append',
    files: '/api/files',
    allNotes: '/api/all-notes',
    search: (query) => `/api/search?q=${encodeURIComponent(query)}`
  }
};