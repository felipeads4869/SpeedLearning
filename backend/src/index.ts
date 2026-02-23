import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database';
import booksRouter from './routes/books.routes';
import sectionsRouter from './routes/sections.routes';
import notesRouter from './routes/notes.routes';
import presentationsRouter from './routes/presentations.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/books', booksRouter);
app.use('/api/sections', sectionsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/presentations', presentationsRouter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Start server
async function start() {
    await initDatabase();

    app.listen(PORT, () => {
        console.log(`
  ╔══════════════════════════════════════╗
  ║     🚀 SpeedLearning Backend         ║
  ║     http://localhost:${PORT}           ║
  ╚══════════════════════════════════════╝
  `);
    });
}

start().catch(console.error);

export default app;
