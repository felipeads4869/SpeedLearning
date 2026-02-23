import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { generateLearningContent, generateImage } from '../services/gemini.service';
import { Presentation, GenerateRequest } from '../types';

const router = Router();
const now = () => new Date().toISOString();

// GET presentations by note (history)
router.get('/note/:noteId', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const presentations = db.data.presentations
            .filter(p => p.note_id === req.params.noteId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        res.json({ success: true, data: presentations });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// GET single presentation
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const presentation = db.data.presentations.find(p => p.id === req.params.id);
        if (!presentation) return res.status(404).json({ success: false, error: 'Presentation not found' });
        res.json({ success: true, data: presentation });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// POST generate presentation from note content
router.post('/generate', async (req: Request, res: Response) => {
    try {
        const { note_id, content, title } = req.body as GenerateRequest;

        if (!note_id || !content || !title) {
            return res.status(400).json({ success: false, error: 'note_id, content, and title are required' });
        }

        if (content.trim().length < 50) {
            return res.status(400).json({ success: false, error: 'El contenido debe tener al menos 50 caracteres' });
        }

        console.log(`🚀 Generating content for: "${title}"`);

        const db = await getDb();

        // Get next version number
        const noteVersions = db.data.presentations.filter(p => p.note_id === note_id);
        const nextVersion = noteVersions.length + 1;

        // Generate content with Gemini
        const generated = await generateLearningContent(title, content);

        // Generate reference image
        const imageUrl = await generateImage(title, generated.shortSummary);

        // Save to database
        const presentation: Presentation = {
            id: uuidv4(),
            note_id,
            version: nextVersion,
            short_summary: generated.shortSummary,
            extended_summary: generated.extendedSummary,
            associations: JSON.stringify(generated.associations),
            mermaid_map: generated.mermaidMap,
            story: generated.story,
            image_url: imageUrl,
            created_at: now()
        };

        db.data.presentations.push(presentation);
        await db.write();

        console.log(`✅ Presentation v${nextVersion} created for note ${note_id}`);
        res.status(201).json({ success: true, data: presentation });
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

// DELETE presentation
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const initial = db.data.presentations.length;
        db.data.presentations = db.data.presentations.filter(p => p.id !== req.params.id);

        if (db.data.presentations.length === initial) {
            return res.status(404).json({ success: false, error: 'Presentation not found' });
        }
        await db.write();
        res.json({ success: true, message: 'Presentation deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

export default router;
