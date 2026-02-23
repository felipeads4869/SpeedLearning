# ⚡ SpeedLearning

> Aplicación de estudio acelerado con IA — tipo OneNote × NotebookLM

**SpeedLearning** es una aplicación full-stack TypeScript/Node.js que combina una interfaz tipo OneNote con el poder de **Gemini AI** para generar automáticamente 5 tipos de contenido de aprendizaje a partir de tus resúmenes.

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm run install:all
# O manualmente:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configurar API Key
El archivo `backend/.env` ya contiene tu API Key de Gemini:
```
GEMINI_API_KEY=AIzaSy...
```

### 3. Iniciar la aplicación

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
```
→ Servidor en `http://localhost:3001`

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```
→ App en `http://localhost:5173`

---

## 🧠 Funcionalidades

### Estructura OneNote
- 📚 **Libros** — con color e ícono personalizables
- 📑 **Secciones** — organización dentro del libro  
- 📝 **Notas** — editor con auto-guardado

### Generación IA (Gemini 2.5 Flash)
Al hacer clic en "Generar Presentación IA", el backend:

1. 📌 **Resumen Ejecutivo** — Síntesis breve de 3-5 líneas
2. 📚 **Resumen Enciclopédico** — 10+ viñetas detalladas con contexto enriquecido
3. 🔗 **Asociaciones Mnemotécnicas** — Conexiones verosímiles para memorizar conceptos difíciles
4. 🗺️ **Mapa Mental** — Diagrama interactivo renderizado con Mermaid.js
5. 📖 **Historia Verosímil** — Narrativa memorable que integra todos los conceptos

### Historial de Versiones
- Cada generación se guarda como una versión (v1, v2, v3...)
- Puedes ver el historial completo y seleccionar cualquier versión

### Exportación PDF
- Botón "PDF" en la presentación → imprime en **modo claro** (óptimo para impresión)
- El mapa mental se renderiza a colores en el PDF

---

## 🏗️ Arquitectura

```
SpeedLearning/
├── backend/
│   ├── src/
│   │   ├── db/database.ts          # lowdb JSON storage
│   │   ├── routes/
│   │   │   ├── books.routes.ts     # CRUD Libros
│   │   │   ├── sections.routes.ts  # CRUD Secciones
│   │   │   ├── notes.routes.ts     # CRUD Notas + búsqueda
│   │   │   └── presentations.routes.ts # Generación IA + historial
│   │   └── services/
│   │       └── gemini.service.ts   # Integración Gemini 2.5 Flash
│   └── data/speedlearning.json     # Base de datos
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Sidebar.tsx          # Panel OneNote (Books/Sections/Notes)
        │   ├── NoteEditor.tsx       # Editor con auto-guardado
        │   ├── PresentationView.tsx # Vista de presentación AI
        │   ├── MermaidChart.tsx     # Renderizado de mapas mentales
        │   └── BookModal.tsx        # Modal creación/edición de libros
        └── services/api.ts          # Cliente API centralizado
```

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Vanilla CSS (dark mode Apple/Solarized) |
| Backend | Node.js + Express + TypeScript |
| Base de datos | lowdb (JSON file, sin compilación nativa) |
| IA | Google Gemini 2.5 Flash |
| Diagramas | Mermaid.js |

---

## ⌨️ Atajos y Gestos

| Acción | Cómo |
|--------|------|
| Editar/eliminar libro | Hover → ⋯ o clic derecho |
| Editar/eliminar sección | Hover → ⋯ |
| Eliminar nota | Clic derecho en la nota del sidebar |
| Buscar notas | Cuadro de búsqueda en el sidebar |
| Auto-guardar | Automático al escribir (1.5s de delay) |
| Exportar PDF | Botón "PDF" en la presentación |

---

*Desarrollado por Felipe Ostos, si requiere una versión personalizada con los últimos avances en neuroplásticidad y aprendizaje acelerado, personalizado para la materia o carreras a estudiar, disponible en felipeostos.com*
