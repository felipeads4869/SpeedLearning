import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface Props {
    chart: string;
    id?: string;
}

// Initialize mermaid once globally
let mermaidReady = false;
function ensureMermaidInit() {
    if (mermaidReady) return;
    mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
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
        mindmap: {
            padding: 20,
            useMaxWidth: true,
        },
    });
    mermaidReady = true;
}

let renderCounter = 0;

export function MermaidChart({ chart, id = 'mc' }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!chart?.trim()) return;

        ensureMermaidInit();
        setStatus('loading');
        setErrorMsg('');

        const uid = `${id}-${++renderCounter}`;

        // Small delay to ensure DOM is ready after React paint
        const timer = setTimeout(async () => {
            try {
                const { svg } = await mermaid.render(uid, chart);
                if (containerRef.current) {
                    // ── Inject print-override styles INSIDE the SVG ──────────
                    // Mermaid bakes its dark-theme fills into an inline <style>
                    // block inside the SVG. External @media print CSS cannot
                    // beat those. We append a second <style> block at the end
                    // of the SVG (higher cascade order) that explicitly forces
                    // light fills + dark text only when printing.
                    const printStyle = `
<style id="mermaid-print-overrides">
@media print {
  rect, polygon {
    fill: #f0f0f2 !important;
    stroke: #aaa !important;
  }
  circle, ellipse {
    fill: #ddeeff !important;
    stroke: #0071e3 !important;
    stroke-width: 1.5px !important;
  }
  text, tspan {
    fill: #111111 !important;
    stroke: none !important;
    font-weight: 600 !important;
  }
  path, line, polyline {
    stroke: #666 !important;
  }
}
</style>`;
                    const svgWithPrintFix = svg.replace('</svg>', printStyle + '\n</svg>');
                    containerRef.current.innerHTML = svgWithPrintFix;

                    // Override fixed width/height so CSS can control sizing
                    const svgEl = containerRef.current.querySelector('svg');
                    if (svgEl) {
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

                    setStatus('ok');
                }
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
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    opacity: status === 'ok' ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                }}
            />
        </div>
    );
}
