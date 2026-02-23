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
  "shortSummary": "Resumen ejecutivo de 6-10 líneas que capture la esencia del tema (2-3 líneas) SEGUIDO OBLIGATORIAMENTE de una sección '✅ Beneficios de dominar esto:' con 4-5 bullets de beneficios concretos y actualizados con enfoque comercial: oportunidades de mercado, salarios, demanda laboral 2025-2026, herramientas líderes o ventajas competitivas reales",
  "extendedSummary": "# 🌐 Primer Gran Tema\n\nIntroduccion enciclopedica del primer gran tema con contexto y datos reales de fuentes confiables y actualizadas al 2026.\n\n## Subtema 1.1\n\nExplicacion detallada con fechas, nombres o estadisticas cuando aplique.\n\n### Aspecto especifico\n\nDetalle preciso de este aspecto.\n\n## Subtema 1.2\n\nOtra explicacion relevante del primer gran tema.\n\n# 🔬 Segundo Gran Tema\n\nIntroduccion del segundo gran tema con informacion enciclopedica.\n\n## Subtema 2.1\n\nContenido detallado y enriquecido.\n[OBLIGATORIO: usa SIEMPRE esta estructura jerarquica. Minimo 2-3 titulos H1 con emoji relevante al subtema, 2-4 subtitulos H2 bajo cada H1, y H3 cuando el detalle lo requiera. Los bullets • solo dentro de secciones H2/H3 si son listas cortas. Total minimo 500 palabras en español]",
  "associations": [
    {
      "concept": "Concepto difícil de recordar",
      "association": "Asociación iverosímil y memorable de una historia de amor con los conceptos de extendedSummary",
      "mnemonic": "Regla mnemotécnica o historia corta para memorizar"
    }
  ],
  "mermaidMap": "mindmap\\n  root((Titulo))\\n    Concepto1\\n      Subconcepto1a\\n      Subconcepto1b\\n    Concepto2\\n      Subconcepto2a",
  "story": "Una historia de amor ABSOLUTAMENTE INVEROSÍMIL, fantástica y surrealista de 4-6 párrafos. Debe ser imposible, mágica, épica o absurda — como un dragón programador que se enamora de una variable, o un dios antiguo que aprende CSS para conquistar a una estrella. Los conceptos del resumen DEBEN estar integrados como elementos clave de la historia (diálogos, poderes, objetos mágicos). Cuanto más imposible e impactante, mejor para la memoria"
}

Reglas CRÍTICAS para el campo mermaidMap (síguelas exactamente o el mapa no se renderizará):
- SINTAXIS: Usa exactamente la sintaxis Mermaid mindmap con indentación de 2 espacios por nivel
- PRIMER NODO: Debe ser: mindmap\n  root((TituloSimple))
- TEXTO DE NODOS: SOLO letras sin acentos ni tildes (usa 'a' no 'á', 'e' no 'é', etc.), sin parentesis (), sin corchetes [], sin llaves {}, sin simbolos especiales &, |, !, #, %, @, <, >
- EJEMPLO CORRECTO DE NODO: "Variables" no "Variables (let, const)" — los paréntesis rompen la sintaxis
- EJEMPLO CORRECTO: "AND logico" no "AND (&&)" — los símbolos rompen la sintaxis  
- Genera entre 3-5 ramas principales, cada una con 2-4 subnodos
- Genera entre 5-8 asociaciones para los conceptos más difíciles
- La historia DEBE ser inverosímil, imposible y fantástica — nunca realista ni aburrida. El impacto emocional es clave para la memorización
- El resumen extendido DEBE usar jerarquía markdown: # con emoji para temas principales, ## para subtemas, ### para detalles específicos. Mínimo 2 secciones H1 con 2 subsecciones H2 cada una. Total mínimo 500 palabras.
- EJEMPLOS DE CÓDIGO: cuando el tema lo requiera, incluye ejemplos de código SIEMPRE dentro de bloques cercados con triple acento grave y el nombre del lenguaje: \`\`\`javascript\nconsole.log('Hola');\n\`\`\` — NUNCA pongas código directo en el texto sin este formato.
- Enriquece con datos reales, fechas, nombres, estadísticas cuando sea relevante
- Responde SOLO con JSON válido, sin texto adicional`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Strip ONLY the outer markdown code fence that Gemini sometimes wraps around the JSON
        // (e.g. ```json\n{...}\n```) — preserve any ``` inside the JSON content itself
        text = text.trim();
        if (text.startsWith('```')) {
            // Remove the opening fence line (```json or ```)
            text = text.replace(/^```\w*\n?/, '');
            // Remove the closing fence at the very end
            text = text.replace(/\n?```\s*$/, '');
        }
        text = text.trim();

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
    // Generates a thematic surreal/fantastical image via Picsum.
    // The seed is combined from title + summary so each topic gets a unique,
    // consistent image. When a real generative image API is available,
    // replace with a prompt like: "surreal fantastical love story, ${title}, dreamlike, no text"
    try {
        const combined = title + summary.slice(0, 80);
        const seed = combined.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        // Wide cinematic format — used next to the Historia Inverosímil
        const imageUrl = `https://picsum.photos/seed/${seed}/1400/600`;
        return imageUrl;
    } catch {
        return null;
    }
}
