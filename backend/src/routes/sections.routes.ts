import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { Section } from '../types';

const router = Router();
const now = () => new Date().toISOString();

// GET sections by book
router.get('/book/:bookId', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const sections = db.data.sections
            .filter(s => s.book_id === req.params.bookId)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        res.json({ success: true, data: sections });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// POST create section
router.post('/', async (req: Request, res: Response) => {
    try {
        const { book_id, name } = req.body;
        if (!book_id || !name) return res.status(400).json({ success: false, error: 'book_id and name required' });

        const db = await getDb();
        const section: Section = {
            id: uuidv4(),
            book_id,
            name,
            created_at: now(),
            updated_at: now()
        };
        db.data.sections.push(section);
        await db.write();
        res.status(201).json({ success: true, data: section });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// PUT update section
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const idx = db.data.sections.findIndex(s => s.id === req.params.id);
        if (idx === -1) return res.status(404).json({ success: false, error: 'Section not found' });

        const { name } = req.body;
        if (name) db.data.sections[idx].name = name;
        db.data.sections[idx].updated_at = now();
        await db.write();
        res.json({ success: true, data: db.data.sections[idx] });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// DELETE section (cascade)
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const section = db.data.sections.find(s => s.id === req.params.id);
        if (!section) return res.status(404).json({ success: false, error: 'Section not found' });

        const noteIds = db.data.notes.filter(n => n.section_id === req.params.id).map(n => n.id);
        db.data.presentations = db.data.presentations.filter(p => !noteIds.includes(p.note_id));
        db.data.notes = db.data.notes.filter(n => n.section_id !== req.params.id);
        db.data.sections = db.data.sections.filter(s => s.id !== req.params.id);
        await db.write();

        res.json({ success: true, message: 'Section deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

export default router;
