import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
    title: string;
    onClose: () => void;
    onConfirm: (data: { name: string; color: string; icon: string }) => void;
    initial?: { name: string; color: string; icon: string };
}

const COLORS = [
    '#0a84ff', '#32d74b', '#ff9f0a', '#ff453a', '#bf5af2',
    '#ff375f', '#64d2ff', '#ac8e68', '#30d158', '#5e5ce6'
];

const ICONS = ['📚', '🔬', '🧮', '⚡', '🌍', '🎯', '💡', '🧠', '🔭', '📊',
    '🏛️', '💻', '🎨', '🌿', '📖', '🚀', '⚗️', '🎵', '🧬', '🏆'];

export function BookModal({ title, onClose, onConfirm, initial }: Props) {
    const [name, setName] = useState(initial?.name || '');
    const [color, setColor] = useState(initial?.color || '#0a84ff');
    const [icon, setIcon] = useState(initial?.icon || '📚');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onConfirm({ name: name.trim(), color, icon });
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 className="modal-title" style={{ marginBottom: 0 }}>{title}</h2>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nombre del Libro</label>
                        <input
                            className="form-input"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Biología Celular"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Color</label>
                        <div className="color-palette">
                            {COLORS.map(c => (
                                <div
                                    key={c}
                                    className={`color-swatch ${c === color ? 'selected' : ''}`}
                                    style={{ background: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Ícono</label>
                        <div className="icon-palette">
                            {ICONS.map(ic => (
                                <div
                                    key={ic}
                                    className={`icon-option ${ic === icon ? 'selected' : ''}`}
                                    onClick={() => setIcon(ic)}
                                >
                                    {ic}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
                            {initial ? 'Guardar Cambios' : 'Crear Libro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
