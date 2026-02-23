import axios from 'axios';
import type { Book, Section, Note, Presentation } from '../types';

const API = axios.create({
    baseURL: 'http://localhost:3001/api',
    timeout: 120000, // 2 minutes for AI generation
});

// Books
export const booksApi = {
    getAll: () => API.get<{ success: boolean; data: Book[] }>('/books'),
    create: (data: { name: string; color: string; icon: string }) =>
        API.post<{ success: boolean; data: Book }>('/books', data),
    update: (id: string, data: Partial<Book>) =>
        API.put<{ success: boolean; data: Book }>(`/books/${id}`, data),
    delete: (id: string) => API.delete(`/books/${id}`),
};

// Sections
export const sectionsApi = {
    getByBook: (bookId: string) =>
        API.get<{ success: boolean; data: Section[] }>(`/sections/book/${bookId}`),
    create: (data: { book_id: string; name: string }) =>
        API.post<{ success: boolean; data: Section }>('/sections', data),
    update: (id: string, name: string) =>
        API.put<{ success: boolean; data: Section }>(`/sections/${id}`, { name }),
    delete: (id: string) => API.delete(`/sections/${id}`),
};

// Notes
export const notesApi = {
    getBySection: (sectionId: string) =>
        API.get<{ success: boolean; data: Note[] }>(`/notes/section/${sectionId}`),
    getById: (id: string) =>
        API.get<{ success: boolean; data: Note }>(`/notes/${id}`),
    search: (query: string) =>
        API.get<{ success: boolean; data: Note[] }>(`/notes/search/${encodeURIComponent(query)}`),
    create: (data: { section_id: string; book_id: string; title: string; content?: string }) =>
        API.post<{ success: boolean; data: Note }>('/notes', data),
    update: (id: string, data: Partial<Note>) =>
        API.put<{ success: boolean; data: Note }>(`/notes/${id}`, data),
    delete: (id: string) => API.delete(`/notes/${id}`),
};

// Presentations
export const presentationsApi = {
    getByNote: (noteId: string) =>
        API.get<{ success: boolean; data: Presentation[] }>(`/presentations/note/${noteId}`),
    getById: (id: string) =>
        API.get<{ success: boolean; data: Presentation }>(`/presentations/${id}`),
    generate: (data: { note_id: string; content: string; title: string }) =>
        API.post<{ success: boolean; data: Presentation }>('/presentations/generate', data),
    delete: (id: string) => API.delete(`/presentations/${id}`),
};
