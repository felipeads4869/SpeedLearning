import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface Props {
    chart: string;
    id?: string;
}

/**
 * Dark config — used for browser/screen view.
 */
const DARK_CONFIG = {
    startOnLoad: false,
    theme: 'dark' as const,
    themeVariables: {
        primaryColor: '#0a84ff',
        primaryTextColor: '#f5f5f7',
        primaryBorderColor: '#0a84ff',
        lineColor: '#636366',
        secondaryColor: '#bf5af2',
        tertiaryColor: '#32d74b',
        background: '#161618',
        mainBkg: '#1c1c1e',
        secondBkg: '#232326',
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontSize: '14px',
    },
    mindmap: { padding: 20, useMaxWidth: true },
};

/**
 * Light/neutral config — used ONLY for print/PDF.
 * We render a second copy of the chart with this theme and
 * hide it on screen; it appears only when printing.
 */
const LIGHT_CONFIG = {
    startOnLoad: false,
    theme: 'neutral' as const,
    themeVariables: {
        primaryColor: '#0071e3',
        primaryTextColor: '#1d1d1f',
        primaryBorderColor: '#0071e3',
        lineColor: '#555',
        secondaryColor: '#7c3aed',
        tertiaryColor: '#059669',
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontSize: '13px',
    },
    mindmap: { padding: 20, useMaxWidth: true },
};

let renderCounter = 0;

/** Remove SVG fixed width/height so CSS can control sizing. */
function fixSvgDimensions(container: HTMLDivElement) {
    const svgEl = container.querySelector('svg');
    if (!svgEl) return;
    const w = svgEl.getAttribute('width');
    const h = svgEl.getAttribute('height');
    if (w && h && !svgEl.getAttribute('viewBox')) {
        svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');
    svgEl.style.width = '100%';
    svgEl.style.height = 'auto';
}

export function MermaidChart({ chart, id = 'mc' }: Props) {
    const darkRef = useRef<HTMLDivElement>(null);
    const lightRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!chart?.trim()) return;

        setStatus('loading');
        setErrorMsg('');

        const base = `${id}-${++renderCounter}`;

        const timer = setTimeout(async () => {
            try {
                // ── 1. Render DARK version (visible on screen) ─────────────
                mermaid.initialize(DARK_CONFIG);
                const { svg: darkSvg } = await mermaid.render(`${base}-dark`, chart);
                if (darkRef.current) {
                    darkRef.current.innerHTML = darkSvg;
                    fixSvgDimensions(darkRef.current);
                }

                // ── 2. Render LIGHT/NEUTRAL version (visible in print) ──────
                // Must use a different uid because Mermaid tracks rendered ids.
                mermaid.initialize(LIGHT_CONFIG);
                const { svg: lightSvg } = await mermaid.render(`${base}-light`, chart);
                if (lightRef.current) {
                    lightRef.current.innerHTML = lightSvg;
                    fixSvgDimensions(lightRef.current);
                }

                // Restore dark config so any subsequent renders (React re-mounts)
                // default to dark.
                mermaid.initialize(DARK_CONFIG);

                setStatus('ok');
            } catch (err) {
                console.error('[MermaidChart] render error:', err);
                console.error('[MermaidChart] chart content:', chart);
                setErrorMsg(String(err));
                setStatus('error');
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [chart, id]);

    if (status === 'error') {
        return (
            <div style={{
                padding: '16px',
                background: 'rgba(255,69,58,0.08)',
                border: '1px solid rgba(255,69,58,0.25)',
                borderRadius: '10px',
                fontSize: '13px'
            }}>
                <div style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: '8px' }}>
                    ⚠️ Error al renderizar el mapa mental
                </div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginBottom: '8px' }}>
                    {errorMsg}
                </div>
                <details>
                    <summary style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
                        Ver sintaxis generada
                    </summary>
                    <pre style={{
                        marginTop: '8px', fontSize: '11px',
                        color: 'var(--text-tertiary)', whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace', background: 'var(--bg-base)',
                        padding: '8px', borderRadius: '6px'
                    }}>
                        {chart}
                    </pre>
                </details>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', minHeight: '140px' }}>
            {status === 'loading' && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="spinner spinner-lg" />
                </div>
            )}

            {/* ── Dark version: shown on screen, hidden in print ── */}
            <div
                ref={darkRef}
                className="mermaid-dark-version"
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    opacity: status === 'ok' ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
            />

            {/* ── Light version: hidden on screen, shown in print ── */}
            <div
                ref={lightRef}
                className="mermaid-light-version"
                style={{
                    width: '100%',
                    display: 'none', // hidden by default; @media print shows it
                    justifyContent: 'center',
                }}
            />
        </div>
    );
}
