import { useState, useEffect, useCallback, useRef } from 'react';
import type { Note } from '../types';
import { notesApi } from '../services/api';
import { PresentationView } from './PresentationView';
import { useToast } from './ToastProvider';
import { Sparkles, Clock, Tag } from 'lucide-react';

interface Props {
    note: Note;
    onNoteUpdate: (note: Note) => void;
}

export function NoteEditor({ note, onNoteUpdate }: Props) {
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [saving, setSaving] = useState(false);
    const [view, setView] = useState<'editor' | 'presentation'>('editor');
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { showToast } = useToast();

    // Sync when note changes
    useEffect(() => {
        setTitle(note.title);
        setContent(note.content);
        setView('editor');
    }, [note.id]);

    // Auto-save debounced
    const saveNote = useCallback(async (newTitle: string, newContent: string) => {
        try {
            setSaving(true);
            const res = await notesApi.update(note.id, { title: newTitle, content: newContent });
            onNoteUpdate(res.data.data);
        } catch {
            showToast('Error al guardar la nota', 'error');
        } finally {
            setSaving(false);
        }
    }, [note.id, onNoteUpdate, showToast]);

    const schedulesSave = useCallback((newTitle: string, newContent: string) => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => saveNote(newTitle, newContent), 1500);
    }, [saveNote]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setTitle(v);
        schedulesSave(v, content);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const v = e.target.value;
        setContent(v);
        schedulesSave(title, v);
    };

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleString('es-ES', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    if (view === 'presentation') {
        return (
            <PresentationView
                note={{ ...note, title, content }}
                onBack={() => setView('editor')}
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Tab bar */}
            <div className="tab-bar">
                <button className={`tab ${view === 'editor' ? 'active' : ''}`} onClick={() => setView('editor')}>
                    ✏️ Nota
                </button>
                <button className={`tab ${'presentation' === (view as string) ? 'active' : ''}`} onClick={() => setView('presentation')}>
                    <Sparkles size={14} /> Presentación
                </button>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: '8px' }}>
                    {saving && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Guardando...</span>}
                    {!saving && <span style={{ fontSize: '11px', color: 'var(--success)', opacity: 0.7 }}>✓ Guardado</span>}
                </div>
            </div>

            <div className="editor-container">
                <div className="note-editor">
                    {/* Title */}
                    <input
                        className="note-title-input"
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Título de la nota..."
                    />

                    {/* Meta */}
                    <div className="note-meta" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} />
                            Modificado: {formatDate(note.updated_at)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Tag size={11} />
                            {content.length} caracteres
                        </span>
                    </div>

                    {/* Content */}
                    <textarea
                        className="note-content-area"
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Escribe aquí tu resumen o apuntes...

Puedes escribir sobre cualquier tema: biología, historia, matemáticas, filosofía...

Una vez que tengas al menos 50 caracteres, podrás generar una presentación enriquecida con IA usando el botón de arriba."
                        autoFocus
                    />
                </div>

                {/* Generate bar */}
                <div className="generate-bar" style={{ maxWidth: '860px', margin: '0 auto' }}>
                    <span className="char-count">
                        {content.length} caracteres
                        {content.length < 50 && <span style={{ color: 'var(--warning)' }}> (mínimo 50)</span>}
                    </span>
                    <button
                        className="btn btn-primary"
                        onClick={() => setView('presentation')}
                        disabled={content.trim().length < 50}
                    >
                        <Sparkles size={15} />
                        Generar Presentación IA
                    </button>
                </div>
            </div>
        </div>
    );
}
