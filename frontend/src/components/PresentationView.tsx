import { useState, useEffect } from 'react';
import type { Presentation, Association, Note } from '../types';
import { presentationsApi } from '../services/api';
import { MermaidChart } from './MermaidChart';
import { useToast } from './ToastProvider';
import {
    BookOpen, Brain, Link, Map, BookMarked,
    Clock, Download, Trash2, RefreshCw, ChevronLeft
} from 'lucide-react';

interface Props {
    note: Note;
    onBack: () => void;
}

export function PresentationView({ note, onBack }: Props) {
    const [presentations, setPresentations] = useState<Presentation[]>([]);
    const [selected, setSelected] = useState<Presentation | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'view' | 'history'>('view');
    const { showToast } = useToast();

    useEffect(() => {
        loadPresentations();
    }, [note.id]);

    async function loadPresentations() {
        try {
            setLoading(true);
            const res = await presentationsApi.getByNote(note.id);
            const list = res.data.data;
            setPresentations(list);
            if (list.length > 0) setSelected(list[0]);
        } catch {
            showToast('Error al cargar presentaciones', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerate() {
        if (!note.content || note.content.trim().length < 50) {
            showToast('La nota necesita al menos 50 caracteres para generar una presentación', 'error');
            return;
        }
        try {
            setGenerating(true);
            showToast('🚀 Generando contenido con Gemini AI...', 'info');
            const res = await presentationsApi.generate({
                note_id: note.id,
                content: note.content,
                title: note.title
            });
            const newPresentation = res.data.data;
            setPresentations(prev => [newPresentation, ...prev]);
            setSelected(newPresentation);
            setActiveTab('view');
            showToast('✅ Presentación generada exitosamente', 'success');
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Error al generar';
            showToast(msg, 'error');
        } finally {
            setGenerating(false);
        }
    }

    async function handleDelete(id: string) {
        try {
            await presentationsApi.delete(id);
            const updated = presentations.filter(p => p.id !== id);
            setPresentations(updated);
            if (selected?.id === id) {
                setSelected(updated[0] || null);
            }
            showToast('Presentación eliminada', 'success');
        } catch {
            showToast('Error al eliminar', 'error');
        }
    }

    function handlePrint() {
        const SELECTORS = '.editor-container, .presentation-container, .main-content, .app-shell, #root';
        const targets = Array.from(document.querySelectorAll<HTMLElement>(SELECTORS));

        // Snapshot current inline styles (may be empty string if none set)
        const snapshots = targets.map(el => ({
            el,
            overflow: el.style.overflow,
            height: el.style.height,
            maxHeight: el.style.maxHeight,
        }));
        const bodySnap = {
            overflow: document.body.style.overflow,
            height: document.body.style.height,
        };
        const htmlSnap = {
            overflow: document.documentElement.style.overflow,
            height: document.documentElement.style.height,
        };

        function applyPrintStyles() {
            targets.forEach(el => {
                el.style.overflow = 'visible';
                el.style.height = 'auto';
                el.style.maxHeight = 'none';
            });
            document.body.style.overflow = 'visible';
            document.body.style.height = 'auto';
            document.documentElement.style.overflow = 'visible';
            document.documentElement.style.height = 'auto';
        }

        function restoreStyles() {
            snapshots.forEach(({ el, overflow, height, maxHeight }) => {
                el.style.overflow = overflow;
                el.style.height = height;
                el.style.maxHeight = maxHeight;
            });
            document.body.style.overflow = bodySnap.overflow;
            document.body.style.height = bodySnap.height;
            document.documentElement.style.overflow = htmlSnap.overflow;
            document.documentElement.style.height = htmlSnap.height;
            // Remove listener after first use
            window.removeEventListener('afterprint', restoreStyles);
        }

        // afterprint fires when print dialog closes (whether user prints or cancels)
        window.addEventListener('afterprint', restoreStyles);

        // Apply styles, wait for DOM reflow, then open print dialog
        applyPrintStyles();
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.print();
            });
        });
    }


    function parseAssociations(raw: string): Association[] {
        try {
            return JSON.parse(raw) as Association[];
        } catch {
            return [];
        }
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString('es-ES', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    /** Inline: **bold** and `code` */
    function parseInline(text: string): React.ReactNode {
        const parts: React.ReactNode[] = [];
        const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
        let lastIdx = 0;
        let match;
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
            const raw = match[0];
            if (raw.startsWith('**')) {
                parts.push(<strong key={match.index}>{raw.slice(2, -2)}</strong>);
            } else {
                parts.push(
                    <code key={match.index} style={{
                        background: 'var(--bg-overlay)', padding: '1px 6px',
                        borderRadius: '4px', fontSize: '0.88em', fontFamily: 'monospace',
                        color: 'var(--accent)'
                    }}>{raw.slice(1, -1)}</code>
                );
            }
            lastIdx = match.index + raw.length;
        }
        if (lastIdx < text.length) parts.push(text.slice(lastIdx));
        return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
    }

    /** Full markdown block renderer — supports # ## ### ####, bullets, paragraphs */
    function renderMarkdown(text: string) {
        if (!text) return null;
        const lines = text.split('\n');
        return lines.map((line, i) => {
            const t = line.trim();

            // Empty line → small spacer
            if (!t) return <div key={i} style={{ height: '6px' }} />;

            // #### H4
            if (/^#{4}\s/.test(t)) {
                return <h5 key={i} className="md-h4">{parseInline(t.replace(/^#{4}\s/, ''))}</h5>;
            }
            // ### H3
            if (/^#{3}\s/.test(t)) {
                return <h4 key={i} className="md-h3">{parseInline(t.replace(/^#{3}\s/, ''))}</h4>;
            }
            // ## H2
            if (/^#{2}\s/.test(t)) {
                return <h3 key={i} className="md-h2">{parseInline(t.replace(/^#{2}\s/, ''))}</h3>;
            }
            // # H1
            if (/^#\s/.test(t)) {
                return <h2 key={i} className="md-h1">{parseInline(t.replace(/^#\s/, ''))}</h2>;
            }

            // Bullet point (-, *, •)
            if (/^[-*•]\s/.test(t)) {
                const clean = t.replace(/^[-*•]\s*/, '');
                return (
                    <div key={i} className="bullet" style={{ display: 'flex', gap: '10px', padding: '4px 0', alignItems: 'flex-start' }}>
                        <div className="bullet-dot" style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: 'var(--accent)', marginTop: '9px', flexShrink: 0
                        }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7' }}>
                            {parseInline(clean)}
                        </span>
                    </div>
                );
            }

            // Plain paragraph
            return (
                <p key={i} className="md-para" style={{
                    color: 'var(--text-secondary)', fontSize: '14px',
                    lineHeight: '1.75', margin: '4px 0'
                }}>
                    {parseInline(t)}
                </p>
            );
        });
    }


    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner spinner-lg" />
                <p className="loading-text">Cargando presentaciones...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Topbar */}
            <div className="topbar">
                <button className="btn-icon" onClick={onBack} title="Volver a la nota">
                    <ChevronLeft size={18} />
                </button>
                <div className="topbar-breadcrumb" style={{ fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Nota:</span>
                    <span>{note.title}</span>
                </div>
                <div className="topbar-actions">
                    {selected && (
                        <button className="btn btn-ghost btn-sm" onClick={handlePrint} title="Exportar PDF">
                            <Download size={14} /> PDF
                        </button>
                    )}
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleGenerate}
                        disabled={generating}
                    >
                        {generating ? (
                            <><div className="spinner" style={{ width: 14, height: 14 }} /> Generando...</>
                        ) : (
                            <><RefreshCw size={14} /> {presentations.length > 0 ? 'Regenerar' : 'Generar'}</>
                        )}
                    </button>
                </div>
            </div>

            {/* Tab bar */}
            <div className="tab-bar">
                <button
                    className={`tab ${activeTab === 'view' ? 'active' : ''}`}
                    onClick={() => setActiveTab('view')}
                >
                    <BookOpen size={14} />
                    Presentación
                    {selected && (
                        <span style={{
                            fontSize: '10px', background: 'var(--accent-subtle)',
                            color: 'var(--accent)', padding: '1px 6px', borderRadius: '99px'
                        }}>v{selected.version}</span>
                    )}
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <Clock size={14} />
                    Historial
                    {presentations.length > 0 && (
                        <span style={{
                            fontSize: '10px', background: 'var(--bg-subtle)',
                            color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: '99px'
                        }}>{presentations.length}</span>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="editor-container">
                {activeTab === 'history' ? (
                    <div className="presentation-container">
                        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
                            Historial de Generaciones
                        </h2>
                        {presentations.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📋</div>
                                <p className="empty-title">Sin historial</p>
                                <p className="empty-desc">Genera tu primera presentación usando el botón "Generar"</p>
                            </div>
                        ) : (
                            <div className="history-list">
                                {presentations.map(p => (
                                    <div
                                        key={p.id}
                                        className={`history-item ${selected?.id === p.id ? 'selected' : ''}`}
                                        onClick={() => { setSelected(p); setActiveTab('view'); }}
                                    >
                                        <span className="history-version">v{p.version}</span>
                                        <div style={{ flex: 1 }}>
                                            <div className="history-date">{formatDate(p.created_at)}</div>
                                            <div className="history-preview">{p.short_summary.slice(0, 80)}...</div>
                                        </div>
                                        <button
                                            className="btn-icon danger"
                                            onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : selected ? (
                    <div className="presentation-container" id="presentation-print">
                        {/* Header */}
                        <div className="presentation-header">
                            <div>
                                <h1 className="presentation-title">{note.title}</h1>
                                <div className="version-badge">
                                    <Clock size={10} /> v{selected.version} · {formatDate(selected.created_at)}
                                </div>
                            </div>
                        </div>

                        {/* Reference image */}
                        {selected.image_url && (
                            <img
                                src={selected.image_url}
                                alt={note.title}
                                className="reference-image"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        )}

                        {/* Short Summary */}
                        <div className="card">
                            <div className="card-header">
                                <div className="card-icon" style={{ background: 'rgba(10,132,255,0.15)' }}>
                                    📌
                                </div>
                                <div>
                                    <div className="card-title">Resumen Ejecutivo</div>
                                    <div className="card-subtitle">Síntesis breve del tema</div>
                                </div>
                            </div>
                            <p className="short-summary">{selected.short_summary}</p>
                        </div>

                        {/* Extended Summary */}
                        <div className="card">
                            <div className="card-header">
                                <div className="card-icon" style={{ background: 'rgba(50,215,75,0.15)' }}>
                                    <BookMarked size={16} color="var(--success)" />
                                </div>
                                <div>
                                    <div className="card-title">Resumen Enciclopédico</div>
                                    <div className="card-subtitle">Análisis detallado con contexto extendido</div>
                                </div>
                            </div>
                            <div className="extended-summary">
                                {renderMarkdown(selected.extended_summary)}
                            </div>
                        </div>

                        {/* Associations */}
                        <div className="card">
                            <div className="card-header">
                                <div className="card-icon" style={{ background: 'rgba(191,90,242,0.15)' }}>
                                    <Link size={16} color="#bf5af2" />
                                </div>
                                <div>
                                    <div className="card-title">Asociaciones Mnemotécnicas</div>
                                    <div className="card-subtitle">Conexiones verosímiles para memorizar conceptos difíciles</div>
                                </div>
                            </div>
                            {parseAssociations(selected.associations).length > 0 ? (
                                <div className="associations-grid">
                                    {parseAssociations(selected.associations).map((assoc, i) => (
                                        <div key={i} className="association-item">
                                            <div className="association-concept">{assoc.concept}</div>
                                            <div className="association-text">{assoc.association}</div>
                                            <div className="association-mnemonic">💡 {assoc.mnemonic}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Sin asociaciones generadas.</p>
                            )}
                        </div>

                        {/* Mind Map */}
                        <div className="card">
                            <div className="card-header">
                                <div className="card-icon" style={{ background: 'rgba(100,210,255,0.15)' }}>
                                    <Map size={16} color="var(--info)" />
                                </div>
                                <div>
                                    <div className="card-title">Mapa Mental</div>
                                    <div className="card-subtitle">Estructura visual del conocimiento (Mermaid.js)</div>
                                </div>
                            </div>
                            <div className="mermaid-container">
                                <MermaidChart chart={selected.mermaid_map} id={`chart-${selected.id}`} />
                            </div>
                        </div>

                        {/* Story */}
                        <div className="card">
                            <div className="card-header">
                                <div className="card-icon" style={{ background: 'rgba(255,159,10,0.15)' }}>
                                    <Brain size={16} color="var(--warning)" />
                                </div>
                                <div>
                                    <div className="card-title">Historia Verosímil</div>
                                    <div className="card-subtitle">Narrativa memorable que integra todos los conceptos</div>
                                </div>
                            </div>
                            <div className="story-text">
                                {selected.story.split('\n\n').map((para, i) => (
                                    <p key={i}>{para}</p>
                                ))}
                            </div>
                        </div>

                        {/* Print footer */}
                        <div style={{ height: '40px' }} className="print-spacer" />
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">✨</div>
                        <p className="empty-title">Sin presentación generada</p>
                        <p className="empty-desc">Haz clic en "Generar" para crear una presentación enriquecida con IA basada en tu nota.</p>
                        <button
                            className="btn btn-primary"
                            onClick={handleGenerate}
                            disabled={generating}
                        >
                            {generating ? (
                                <><div className="spinner" /> Generando con Gemini...</>
                            ) : (
                                '✨ Generar Presentación'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
