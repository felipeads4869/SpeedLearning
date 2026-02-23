import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { Book } from '../types';

const router = Router();

const now = () => new Date().toISOString();

// GET all books
router.get('/', async (_req: Request, res: Response) => {
    try {
        const db = await getDb();
        const books = [...db.data.books].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        res.json({ success: true, data: books });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// GET single book
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const book = db.data.books.find(b => b.id === req.params.id);
        if (!book) return res.status(404).json({ success: false, error: 'Book not found' });
        res.json({ success: true, data: book });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// POST create book
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, color = '#4A90D9', icon = '📚' } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

        const db = await getDb();
        const book: Book = {
            id: uuidv4(),
            name,
            color,
            icon,
            created_at: now(),
            updated_at: now()
        };
        db.data.books.push(book);
        await db.write();
        res.status(201).json({ success: true, data: book });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// PUT update book
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const idx = db.data.books.findIndex(b => b.id === req.params.id);
        if (idx === -1) return res.status(404).json({ success: false, error: 'Book not found' });

        const { name, color, icon } = req.body;
        if (name) db.data.books[idx].name = name;
        if (color) db.data.books[idx].color = color;
        if (icon) db.data.books[idx].icon = icon;
        db.data.books[idx].updated_at = now();
        await db.write();

        res.json({ success: true, data: db.data.books[idx] });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// DELETE book
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const initialLength = db.data.books.length;

        // Also delete related sections, notes, presentations
        const bookSections = db.data.sections.filter(s => s.book_id === req.params.id);
        const sectionIds = bookSections.map(s => s.id);
        const noteIds = db.data.notes.filter(n => sectionIds.includes(n.section_id)).map(n => n.id);

        db.data.presentations = db.data.presentations.filter(p => !noteIds.includes(p.note_id));
        db.data.notes = db.data.notes.filter(n => !sectionIds.includes(n.section_id));
        db.data.sections = db.data.sections.filter(s => s.book_id !== req.params.id);
        db.data.books = db.data.books.filter(b => b.id !== req.params.id);

        await db.write();

        if (db.data.books.length === initialLength) {
            return res.status(404).json({ success: false, error: 'Book not found' });
        }
        res.json({ success: true, message: 'Book deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

export default router;
