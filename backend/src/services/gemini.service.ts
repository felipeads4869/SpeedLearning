import { GoogleGenerativeAI } from '@google/generative-ai';
import { Association } from '../types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

interface GeneratedContent {
    shortSummary: string;
    extendedSummary: string;
    associations: Association[];
    mermaidMap: string;
    story: string;
}

export async function generateLearningContent(
    title: string,
    content: string
): Promise<GeneratedContent> {
    const prompt = `Eres un experto académico y pedagogo especializado en crear material de aprendizaje de alta calidad. 
  
El usuario ha escrito el siguiente resumen sobre "${title}":

---
${content}
---

Basándote en este contenido, enriquécelo con información enciclopédica confiable y genera el siguiente material educativo en español. 
Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta (sin markdown, sin bloques de código, solo JSON puro):

{
  "shortSummary": "Resumen ejecutivo conciso de 3-5 líneas que capture la esencia del tema",
  "extendedSummary": "• Punto 1 con información detallada y enriquecida\n• Punto 2 con contexto histórico o científico\n• Punto 3 con aplicaciones prácticas\n• Punto 4 con datos relevantes\n• Punto 5 con conexiones con otros conceptos\n[mínimo 8-12 viñetas detalladas, cada una comenzando con •]",
  "associations": [
    {
      "concept": "Concepto difícil de recordar",
      "association": "Asociación verosímil y memorable que conecta el concepto con algo cotidiano",
      "mnemonic": "Regla mnemotécnica o historia corta para memorizar"
    }
  ],
  "mermaidMap": "mindmap\\n  root((Titulo))\\n    Concepto1\\n      Subconcepto1a\\n      Subconcepto1b\\n    Concepto2\\n      Subconcepto2a",
  "story": "Una historia narrativa verosímil y entretenida de 3-5 párrafos que integre todos los conceptos principales del resumen de forma memorable y creativa, usando personajes y situaciones reales o ficticias plausibles"
}

Reglas CRÍTICAS para el campo mermaidMap (síguelas exactamente o el mapa no se renderizará):
- SINTAXIS: Usa exactamente la sintaxis Mermaid mindmap con indentación de 2 espacios por nivel
- PRIMER NODO: Debe ser: mindmap\n  root((TituloSimple))
- TEXTO DE NODOS: SOLO letras sin acentos ni tildes (usa 'a' no 'á', 'e' no 'é', etc.), sin parentesis (), sin corchetes [], sin llaves {}, sin simbolos especiales &, |, !, #, %, @, <, >
- EJEMPLO CORRECTO DE NODO: "Variables" no "Variables (let, const)" — los paréntesis rompen la sintaxis
- EJEMPLO CORRECTO: "AND logico" no "AND (&&)" — los símbolos rompen la sintaxis  
- Genera entre 3-5 ramas principales, cada una con 2-4 subnodos
- Genera entre 5-8 asociaciones para los conceptos más difíciles
- La historia debe ser coherente, verosímil y educativa
- El resumen extendido debe tener al menos 10 viñetas detalladas
- Enriquece con datos reales, fechas, nombres, estadísticas cuando sea relevante
- Responde SOLO con JSON válido, sin texto adicional`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Clean potential markdown code blocks
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(text) as GeneratedContent;

        // Sanitize mermaid map: remove problematic characters from node labels
        if (parsed.mermaidMap) {
            parsed.mermaidMap = sanitizeMermaidMap(parsed.mermaidMap);
        }

        return parsed;
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Sanitizes mermaid mindmap syntax to remove characters that cause parse errors.
 * Strips accents, parentheses, brackets, and special symbols from node labels.
 */
function sanitizeMermaidMap(raw: string): string {
    const lines = raw.split('\n');
    return lines.map((line, index) => {
        // Keep the first two lines (mindmap declaration and root) as-is
        if (index < 2) return line;

        // Extract indentation and node text
        const match = line.match(/^(\s*)(.*)$/);
        if (!match) return line;
        const [, indent, nodeText] = match;

        // Remove accented characters (normalize and strip diacritics)
        const normalized = nodeText
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // strip diacritics
            .replace(/[()[\]{}&|!#%@<>*"';=+^~`\\]/g, '') // strip special chars
            .replace(/\s+/g, ' ')
            .trim();

        return indent + normalized;
    }).join('\n');
}

export async function generateImage(title: string, summary: string): Promise<string | null> {
    // Imagen placeholder con Picsum para referencia visual temática
    // La integración con Nano Banana o imagen generativa puede reemplazar esto
    try {
        // Use a deterministic seed based on the title for consistent images
        const seed = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const imageUrl = `https://picsum.photos/seed/${seed}/1200/400`;
        return imageUrl;
    } catch {
        return null;
    }
}
