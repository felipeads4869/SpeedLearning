import { useState, useEffect, useRef } from 'react';
import type { Book, Section, Note } from '../types';
import { booksApi, sectionsApi, notesApi } from '../services/api';
import { BookModal } from './BookModal';
import { useToast } from './ToastProvider';
import {
    ChevronRight, Plus, Search, MoreHorizontal,
    Pencil, Trash2, FileText, FolderPlus, X, Check
} from 'lucide-react';

interface Props {
    selectedNote: Note | null;
    onSelectNote: (note: Note | null) => void;
}

interface ContextMenu {
    type: 'book' | 'section' | 'note';
    id: string;
    x: number;
    y: number;
    item: Book | Section | Note;
}

// Mini modal reutilizable para texto
interface TextModalProps {
    title: string;
    placeholder: string;
    initialValue?: string;
    confirmLabel?: string;
    onConfirm: (value: string) => void;
    onClose: () => void;
}

function TextModal({ title, placeholder, initialValue = '', confirmLabel = 'Crear', onConfirm, onClose }: TextModalProps) {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (value.trim()) {
            onConfirm(value.trim());
        }
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 600,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                    width: '340px',
                    boxShadow: 'var(--shadow-lg)',
                    animation: 'slideUp 0.18s ease'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{title}</h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}
                    >
                        <X size={16} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        placeholder={placeholder}
                        style={{
                            width: '100%', padding: '9px 12px',
                            background: 'var(--bg-overlay)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: '14px', fontFamily: 'inherit',
                            outline: 'none', boxSizing: 'border-box',
                        }}
                        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={!value.trim()}>
                            <Check size={13} /> {confirmLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Mini modal de confirmación
interface ConfirmModalProps {
    message: string;
    dangerLabel?: string;
    onConfirm: () => void;
    onClose: () => void;
}

function ConfirmModal({ message, dangerLabel = 'Eliminar', onConfirm, onClose }: ConfirmModalProps) {
    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 600,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                    width: '320px',
                    boxShadow: 'var(--shadow-lg)',
                    animation: 'slideUp 0.18s ease'
                }}
                onClick={e => e.stopPropagation()}
            >
                <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '7px 14px', borderRadius: 'var(--radius-md)',
                            background: 'var(--danger)', border: 'none', color: '#fff',
                            fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500
                        }}
                    >
                        <Trash2 size={12} /> {dangerLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

type ModalState =
    | { kind: 'none' }
    | { kind: 'createSection'; bookId: string }
    | { kind: 'editSection'; section: Section }
    | { kind: 'createNote'; section: Section }
    | { kind: 'deleteBook'; book: Book }
    | { kind: 'deleteSection'; section: Section }
    | { kind: 'deleteNote'; note: Note };

export function Sidebar({ selectedNote, onSelectNote }: Props) {
    const [books, setBooks] = useState<Book[]>([]);
    const [sections, setSections] = useState<Record<string, Section[]>>({});
    const [notes, setNotes] = useState<Record<string, Note[]>>({});
    const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [activeBook, setActiveBook] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Note[] | null>(null);
    const [bookModal, setBookModal] = useState<{ open: boolean; editing?: Book }>({ open: false });
    const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
    const [modal, setModal] = useState<ModalState>({ kind: 'none' });
    const { showToast } = useToast();

    useEffect(() => { loadBooks(); }, []);

    useEffect(() => {
        const handler = () => setContextMenu(null);
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults(null); return; }
        const t = setTimeout(async () => {
            try {
                const res = await notesApi.search(searchQuery);
                setSearchResults(res.data.data);
            } catch {
                setSearchResults([]);
            }
        }, 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    async function loadBooks() {
        try {
            const res = await booksApi.getAll();
            setBooks(res.data.data);
        } catch {
            showToast('Error al cargar libros', 'error');
        }
    }

    async function loadSections(bookId: string, force = false) {
        if (sections[bookId] && !force) return;
        try {
            const res = await sectionsApi.getByBook(bookId);
            setSections(prev => ({ ...prev, [bookId]: res.data.data }));
        } catch {
            showToast('Error al cargar secciones', 'error');
        }
    }

    async function loadNotes(sectionId: string, force = false) {
        if (notes[sectionId] && !force) return;
        try {
            const res = await notesApi.getBySection(sectionId);
            setNotes(prev => ({ ...prev, [sectionId]: res.data.data }));
        } catch {
            showToast('Error al cargar notas', 'error');
        }
    }

    function toggleBook(book: Book) {
        const isOpen = expandedBooks.has(book.id);
        if (!isOpen) {
            loadSections(book.id);
            setExpandedBooks(prev => new Set([...prev, book.id]));
        } else {
            setExpandedBooks(prev => { const s = new Set(prev); s.delete(book.id); return s; });
        }
        setActiveBook(book.id);
    }

    function toggleSection(section: Section) {
        const isOpen = expandedSections.has(section.id);
        if (!isOpen) {
            loadNotes(section.id);
            setExpandedSections(prev => new Set([...prev, section.id]));
        } else {
            setExpandedSections(prev => { const s = new Set(prev); s.delete(section.id); return s; });
        }
    }

    // ── Book handlers ──────────────────────────────────────────────────
    async function handleCreateBook(data: { name: string; color: string; icon: string }) {
        try {
            const res = await booksApi.create(data);
            setBooks(prev => [res.data.data, ...prev]);
            setBookModal({ open: false });
            showToast(`Libro "${data.name}" creado ✓`, 'success');
        } catch {
            showToast('Error al crear el libro', 'error');
        }
    }

    async function handleEditBook(book: Book, data: { name: string; color: string; icon: string }) {
        try {
            const res = await booksApi.update(book.id, data);
            setBooks(prev => prev.map(b => b.id === book.id ? res.data.data : b));
            setBookModal({ open: false });
            showToast('Libro actualizado ✓', 'success');
        } catch {
            showToast('Error al actualizar el libro', 'error');
        }
    }

    async function doDeleteBook(book: Book) {
        try {
            await booksApi.delete(book.id);
            setBooks(prev => prev.filter(b => b.id !== book.id));
            setSections(prev => { const s = { ...prev }; delete s[book.id]; return s; });
            if (selectedNote?.book_id === book.id) onSelectNote(null);
            showToast('Libro eliminado', 'success');
        } catch {
            showToast('Error al eliminar el libro', 'error');
        }
    }

    // ── Section handlers ───────────────────────────────────────────────
    async function doCreateSection(bookId: string, name: string) {
        try {
            const res = await sectionsApi.create({ book_id: bookId, name });
            setSections(prev => ({ ...prev, [bookId]: [...(prev[bookId] || []), res.data.data] }));
            // Auto-expand the new section
            setExpandedSections(prev => new Set([...prev, res.data.data.id]));
            // Make sure book is expanded
            setExpandedBooks(prev => new Set([...prev, bookId]));
            showToast(`Sección "${name}" creada ✓`, 'success');
        } catch {
            showToast('Error al crear la sección', 'error');
        }
    }

    async function doEditSection(section: Section, name: string) {
        try {
            const res = await sectionsApi.update(section.id, name);
            setSections(prev => ({
                ...prev,
                [section.book_id]: (prev[section.book_id] || []).map(s =>
                    s.id === section.id ? res.data.data : s
                )
            }));
            showToast('Sección renombrada ✓', 'success');
        } catch {
            showToast('Error al renombrar la sección', 'error');
        }
    }

    async function doDeleteSection(section: Section) {
        try {
            await sectionsApi.delete(section.id);
            setSections(prev => ({
                ...prev,
                [section.book_id]: (prev[section.book_id] || []).filter(s => s.id !== section.id)
            }));
            setNotes(prev => { const s = { ...prev }; delete s[section.id]; return s; });
            if (selectedNote?.section_id === section.id) onSelectNote(null);
            showToast('Sección eliminada', 'success');
        } catch {
            showToast('Error al eliminar la sección', 'error');
        }
    }

    // ── Note handlers ──────────────────────────────────────────────────
    async function doCreateNote(section: Section, title: string) {
        try {
            const res = await notesApi.create({
                section_id: section.id,
                book_id: section.book_id,
                title
            });
            const newNote = res.data.data;
            setNotes(prev => ({
                ...prev,
                [section.id]: [newNote, ...(prev[section.id] || [])]
            }));
            // Auto-expand section if not already
            setExpandedSections(prev => new Set([...prev, section.id]));
            onSelectNote(newNote);
            showToast(`Nota "${title}" creada ✓`, 'success');
        } catch {
            showToast('Error al crear la nota', 'error');
        }
    }

    async function doDeleteNote(note: Note) {
        try {
            await notesApi.delete(note.id);
            setNotes(prev => ({
                ...prev,
                [note.section_id]: (prev[note.section_id] || []).filter(n => n.id !== note.id)
            }));
            if (selectedNote?.id === note.id) onSelectNote(null);
            showToast('Nota eliminada', 'success');
        } catch {
            showToast('Error al eliminar la nota', 'error');
        }
    }

    function showCtxMenu(e: React.MouseEvent, type: ContextMenu['type'], item: Book | Section | Note) {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ type, id: (item as { id: string }).id, x: e.clientX, y: e.clientY, item });
    }

    const closeModal = () => setModal({ kind: 'none' });

    return (
        <div className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <div className="app-logo">
                    <div className="app-logo-icon">⚡</div>
                    <div>
                        <div className="app-logo-text">SpeedLearning</div>
                        <div className="app-logo-sub">Estudio acelerado con IA</div>
                    </div>
                </div>
                <div className="search-box">
                    <Search size={14} />
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Buscar notas..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="sidebar-content">
                {searchResults ? (
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', padding: '4px 8px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
                        </div>
                        {searchResults.length === 0 ? (
                            <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                                Sin resultados para "{searchQuery}"
                            </div>
                        ) : (
                            searchResults.map(note => (
                                <div
                                    key={note.id}
                                    className={`note-sidebar-item ${selectedNote?.id === note.id ? 'active' : ''}`}
                                    onClick={() => { onSelectNote(note); setSearchQuery(''); setSearchResults(null); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <FileText size={11} />
                                    {note.title}
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <>
                        {books.map(book => (
                            <div key={book.id} className="book-item">
                                <div
                                    className={`book-header ${activeBook === book.id ? 'active' : ''}`}
                                    onClick={() => toggleBook(book)}
                                >
                                    <div className="book-color-dot" style={{ background: book.color }} />
                                    <span className="book-icon">{book.icon}</span>
                                    <span className="book-name">{book.name}</span>
                                    <div className="book-actions" onClick={e => e.stopPropagation()}>
                                        <button
                                            className="btn-icon"
                                            style={{ padding: '3px' }}
                                            onClick={e => showCtxMenu(e, 'book', book)}
                                            title="Opciones del libro"
                                        >
                                            <MoreHorizontal size={13} />
                                        </button>
                                    </div>
                                    <ChevronRight
                                        size={13}
                                        className={`book-chevron ${expandedBooks.has(book.id) ? 'open' : ''}`}
                                    />
                                </div>

                                {expandedBooks.has(book.id) && (
                                    <div className="sections-list">
                                        {(sections[book.id] || []).length === 0 && (
                                            <div style={{ fontSize: '12px', color: 'var(--text-disabled)', padding: '6px 12px', fontStyle: 'italic' }}>
                                                Sin secciones
                                            </div>
                                        )}

                                        {(sections[book.id] || []).map(section => (
                                            <div key={section.id} className="section-item">
                                                <div
                                                    className={`section-header ${expandedSections.has(section.id) ? 'active' : ''}`}
                                                    onClick={() => toggleSection(section)}
                                                >
                                                    <ChevronRight
                                                        size={11}
                                                        style={{
                                                            color: 'var(--text-tertiary)',
                                                            transform: expandedSections.has(section.id) ? 'rotate(90deg)' : 'none',
                                                            transition: 'transform 0.2s ease',
                                                            flexShrink: 0
                                                        }}
                                                    />
                                                    <span className="section-name">{section.name}</span>
                                                    <span className="section-count">
                                                        {(notes[section.id] || []).length}
                                                    </span>
                                                    <button
                                                        className="btn-icon"
                                                        style={{ padding: '2px', opacity: 0.7 }}
                                                        title="Opciones de sección"
                                                        onClick={e => { e.stopPropagation(); showCtxMenu(e, 'section', section); }}
                                                    >
                                                        <MoreHorizontal size={11} />
                                                    </button>
                                                </div>

                                                {expandedSections.has(section.id) && (
                                                    <div className="notes-list">
                                                        {(notes[section.id] || []).map(note => (
                                                            <div
                                                                key={note.id}
                                                                className={`note-sidebar-item ${selectedNote?.id === note.id ? 'active' : ''}`}
                                                                onClick={() => onSelectNote(note)}
                                                                onContextMenu={e => showCtxMenu(e, 'note', note)}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                                            >
                                                                <FileText size={10} style={{ flexShrink: 0 }} />
                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {note.title}
                                                                </span>
                                                            </div>
                                                        ))}

                                                        {/* ✅ Botón CREAR NOTA siempre visible */}
                                                        <button
                                                            className="add-btn"
                                                            style={{ marginTop: '2px' }}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setModal({ kind: 'createNote', section });
                                                            }}
                                                        >
                                                            <Plus size={10} /> Nueva nota
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* ✅ Botón CREAR SECCIÓN siempre visible en el libro expandido */}
                                        <button
                                            className="add-btn"
                                            style={{ marginTop: '4px' }}
                                            onClick={e => {
                                                e.stopPropagation();
                                                setModal({ kind: 'createSection', bookId: book.id });
                                            }}
                                        >
                                            <FolderPlus size={10} /> Nueva sección
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        <button
                            className="add-btn"
                            style={{ margin: '8px 0' }}
                            onClick={() => setBookModal({ open: true })}
                        >
                            <Plus size={12} /> Nuevo libro
                        </button>
                    </>
                )}
            </div>

            {/* ── Book Modal ──────────────────────────────── */}
            {bookModal.open && (
                <BookModal
                    title={bookModal.editing ? 'Editar Libro' : 'Nuevo Libro'}
                    initial={bookModal.editing}
                    onClose={() => setBookModal({ open: false })}
                    onConfirm={data => {
                        if (bookModal.editing) handleEditBook(bookModal.editing, data);
                        else handleCreateBook(data);
                    }}
                />
            )}

            {/* ── Inline modals ──────────────────────────── */}
            {modal.kind === 'createSection' && (
                <TextModal
                    title="Nueva Sección"
                    placeholder="Ej: Capítulo 1 — Introducción"
                    confirmLabel="Crear sección"
                    onClose={closeModal}
                    onConfirm={name => { doCreateSection(modal.bookId, name); closeModal(); }}
                />
            )}
            {modal.kind === 'editSection' && (
                <TextModal
                    title="Renombrar Sección"
                    placeholder="Nombre de la sección"
                    initialValue={modal.section.name}
                    confirmLabel="Guardar"
                    onClose={closeModal}
                    onConfirm={name => { doEditSection(modal.section, name); closeModal(); }}
                />
            )}
            {modal.kind === 'createNote' && (
                <TextModal
                    title="Nueva Nota"
                    placeholder="Ej: Membrana Plasmática"
                    confirmLabel="Crear nota"
                    onClose={closeModal}
                    onConfirm={title => { doCreateNote(modal.section, title); closeModal(); }}
                />
            )}
            {modal.kind === 'deleteBook' && (
                <ConfirmModal
                    message={`¿Eliminar el libro "${modal.book.name}" y TODO su contenido? Esta acción no se puede deshacer.`}
                    onClose={closeModal}
                    onConfirm={() => doDeleteBook(modal.book)}
                />
            )}
            {modal.kind === 'deleteSection' && (
                <ConfirmModal
                    message={`¿Eliminar la sección "${modal.section.name}" y todas sus notas?`}
                    onClose={closeModal}
                    onConfirm={() => doDeleteSection(modal.section)}
                />
            )}
            {modal.kind === 'deleteNote' && (
                <ConfirmModal
                    message={`¿Eliminar la nota "${modal.note.title}"?`}
                    onClose={closeModal}
                    onConfirm={() => doDeleteNote(modal.note)}
                />
            )}

            {/* ── Context Menu ───────────────────────────── */}
            {contextMenu && (
                <div
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 500,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        overflow: 'hidden',
                        minWidth: '160px',
                        animation: 'fadeIn 0.1s ease'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {contextMenu.type === 'book' && (
                        <>
                            <CtxItem icon={<Pencil size={13} />} label="Editar libro" onClick={() => {
                                setBookModal({ open: true, editing: contextMenu.item as Book });
                                setContextMenu(null);
                            }} />
                            <CtxItem icon={<FolderPlus size={13} />} label="Nueva sección" onClick={() => {
                                setModal({ kind: 'createSection', bookId: (contextMenu.item as Book).id });
                                setContextMenu(null);
                            }} />
                            <CtxItem icon={<Trash2 size={13} />} label="Eliminar libro" danger onClick={() => {
                                setModal({ kind: 'deleteBook', book: contextMenu.item as Book });
                                setContextMenu(null);
                            }} />
                        </>
                    )}
                    {contextMenu.type === 'section' && (
                        <>
                            <CtxItem icon={<Pencil size={13} />} label="Renombrar" onClick={() => {
                                setModal({ kind: 'editSection', section: contextMenu.item as Section });
                                setContextMenu(null);
                            }} />
                            <CtxItem icon={<Plus size={13} />} label="Nueva nota" onClick={() => {
                                setModal({ kind: 'createNote', section: contextMenu.item as Section });
                                setContextMenu(null);
                            }} />
                            <CtxItem icon={<Trash2 size={13} />} label="Eliminar sección" danger onClick={() => {
                                setModal({ kind: 'deleteSection', section: contextMenu.item as Section });
                                setContextMenu(null);
                            }} />
                        </>
                    )}
                    {contextMenu.type === 'note' && (
                        <>
                            <CtxItem icon={<Trash2 size={13} />} label="Eliminar nota" danger onClick={() => {
                                setModal({ kind: 'deleteNote', note: contextMenu.item as Note });
                                setContextMenu(null);
                            }} />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function CtxItem({ icon, label, onClick, danger }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '8px 12px', background: 'none', border: 'none',
                color: danger ? 'var(--danger)' : 'var(--text-primary)',
                fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.15s ease', textAlign: 'left'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = danger ? 'rgba(255,69,58,0.1)' : 'var(--bg-overlay)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
            {icon}
            {label}
        </button>
    );
}
