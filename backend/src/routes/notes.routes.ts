import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { Note } from '../types';

const router = Router();
const now = () => new Date().toISOString();

// GET notes by section
router.get('/section/:sectionId', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const notes = db.data.notes
            .filter(n => n.section_id === req.params.sectionId)
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        res.json({ success: true, data: notes });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// GET search notes
router.get('/search/:query', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const q = req.params.query.toLowerCase();
        const notes = db.data.notes
            .filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 50);
        res.json({ success: true, data: notes });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// GET single note
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const note = db.data.notes.find(n => n.id === req.params.id);
        if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
        res.json({ success: true, data: note });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// POST create note
router.post('/', async (req: Request, res: Response) => {
    try {
        const { section_id, book_id, title, content = '', tags = '[]' } = req.body;
        if (!section_id || !book_id || !title)
            return res.status(400).json({ success: false, error: 'section_id, book_id, and title required' });

        const db = await getDb();
        const note: Note = {
            id: uuidv4(),
            section_id,
            book_id,
            title,
            content,
            tags,
            created_at: now(),
            updated_at: now()
        };
        db.data.notes.push(note);
        await db.write();
        res.status(201).json({ success: true, data: note });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// PUT update note
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const idx = db.data.notes.findIndex(n => n.id === req.params.id);
        if (idx === -1) return res.status(404).json({ success: false, error: 'Note not found' });

        const { title, content, tags } = req.body;
        if (title !== undefined) db.data.notes[idx].title = title;
        if (content !== undefined) db.data.notes[idx].content = content;
        if (tags !== undefined) db.data.notes[idx].tags = tags;
        db.data.notes[idx].updated_at = now();
        await db.write();
        res.json({ success: true, data: db.data.notes[idx] });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// DELETE note
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const note = db.data.notes.find(n => n.id === req.params.id);
        if (!note) return res.status(404).json({ success: false, error: 'Note not found' });

        db.data.presentations = db.data.presentations.filter(p => p.note_id !== req.params.id);
        db.data.notes = db.data.notes.filter(n => n.id !== req.params.id);
        await db.write();
        res.json({ success: true, message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

export default router;
