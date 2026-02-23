import { useState } from 'react';
import type { Note } from './types';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { ToastProvider } from './components/ToastProvider';
import { BookOpen } from 'lucide-react';
import './index.css';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

function AppContent() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  return (
    <div className={`app-shell${sidebarHidden ? ' sidebar-hidden' : ''}`}>
      <Sidebar
        selectedNote={selectedNote}
        onSelectNote={setSelectedNote}
      />

      <div className="main-content">
        {/* Sidebar toggle button — always visible in topbar */}
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarHidden(h => !h)}
          title={sidebarHidden ? 'Mostrar panel' : 'Ocultar panel'}
        >
          {sidebarHidden
            ? <PanelLeftOpen size={18} />
            : <PanelLeftClose size={18} />}
        </button>

        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onNoteUpdate={setSelectedNote}
          />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="empty-state" style={{ height: '100%' }}>
      <div style={{
        width: 72, height: 72,
        background: 'linear-gradient(135deg, var(--accent), #5ac8fa)',
        borderRadius: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36,
        boxShadow: '0 8px 30px rgba(10,132,255,0.3)'
      }}>
        ⚡
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
        SpeedLearning
      </h1>
      <p className="empty-desc" style={{ maxWidth: '400px', fontSize: '14px' }}>
        Tu estudio potenciado por IA. Selecciona una nota para comenzar a editar,
        o crea un nuevo libro desde el panel lateral.
      </p>
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center',
        marginTop: '8px'
      }}>
        {[
          { icon: '📝', text: 'Escribe tu resumen' },
          { icon: '🚀', text: 'Genera con Gemini AI' },
          { icon: '🧠', text: 'Aprende más rápido' },
        ].map(item => (
          <div key={item.text} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '10px 16px',
            fontSize: '13px', color: 'var(--text-secondary)'
          }}>
            <span>{item.icon}</span> {item.text}
          </div>
        ))}
      </div>
      <div style={{
        marginTop: '24px',
        display: 'flex', alignItems: 'center', gap: '8px',
        color: 'var(--text-disabled)', fontSize: '12px'
      }}>
        <BookOpen size={13} />
        Crea un libro en el panel izquierdo para comenzar
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
