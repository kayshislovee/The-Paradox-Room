import { useEffect, useRef, useState } from 'react';

interface Props {
    active: boolean;
    duration?: number; // ms
}

export function GlitchOverlay({ active, duration = 2000 }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const startRef = useRef<number>(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!active) return;
        setVisible(true);
        startRef.current = performance.now();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const W = canvas.width;
        const H = canvas.height;

        // Random glitch slices
        const makeSlices = () => Array.from({ length: 12 }, () => ({
            y: Math.random() * H,
            h: 2 + Math.random() * 30,
            offsetX: (Math.random() - 0.5) * 60,
            r: Math.random() > 0.5,
        }));

        let slices = makeSlices();
        let rgbR = { x: 0, y: 0 };
        let rgbG = { x: 0, y: 0 };
        let rgbB = { x: 0, y: 0 };
        let lastSliceChange = 0;

        const draw = (now: number) => {
            const elapsed = now - startRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Fade out over time
            const alpha = progress < 0.6 ? 1 : 1 - ((progress - 0.6) / 0.4);
            if (alpha <= 0) {
                ctx.clearRect(0, 0, W, H);
                setVisible(false);
                return;
            }

            ctx.clearRect(0, 0, W, H);

            // Update RGB split values
            if (progress < 0.5) {
                const intensity = 1 - progress * 2;
                const t = elapsed / 1000;
                rgbR = {
                    x: Math.sin(t * 7.3) * 12 * intensity,
                    y: Math.cos(t * 3.1) * 6 * intensity,
                };
                rgbG = {
                    x: Math.sin(t * 5.7 + 1) * 8 * intensity,
                    y: Math.cos(t * 4.2) * 4 * intensity,
                };
                rgbB = {
                    x: Math.sin(t * 9.1 + 2) * 15 * intensity,
                    y: Math.cos(t * 2.8) * 8 * intensity,
                };
            } else {
                rgbR = { x: rgbR.x * 0.85, y: rgbR.y * 0.85 };
                rgbG = { x: rgbG.x * 0.85, y: rgbG.y * 0.85 };
                rgbB = { x: rgbB.x * 0.85, y: rgbB.y * 0.85 };
            }

            // RGB split colored bars
            ctx.globalAlpha = alpha * 0.12;
            ctx.fillStyle = `rgb(255,0,0)`;
            ctx.fillRect(rgbR.x, 0, W, H);

            ctx.globalAlpha = alpha * 0.10;
            ctx.fillStyle = `rgb(0,255,0)`;
            ctx.fillRect(rgbG.x, 0, W, H);

            ctx.globalAlpha = alpha * 0.14;
            ctx.fillStyle = `rgb(0,100,255)`;
            ctx.fillRect(rgbB.x, 0, W, H);

            // Glitch slices
            if (elapsed - lastSliceChange > 80 + Math.random() * 120) {
                slices = makeSlices();
                lastSliceChange = elapsed;
            }

            if (progress < 0.7) {
                slices.forEach(slice => {
                    ctx.globalAlpha = alpha * (0.15 + Math.random() * 0.25);
                    ctx.fillStyle = slice.r ? 'rgba(255,0,60,0.5)' : 'rgba(0,200,255,0.4)';
                    ctx.fillRect(slice.offsetX, slice.y, W, slice.h);
                });
            }

            // Scanlines
            ctx.globalAlpha = alpha * 0.06;
            ctx.fillStyle = '#000';
            for (let y = 0; y < H; y += 4) {
                ctx.fillRect(0, y, W, 2);
            }

            // Flash at start
            if (elapsed < 150) {
                ctx.globalAlpha = (1 - elapsed / 150) * 0.4;
                ctx.fillStyle = '#ff0040';
                ctx.fillRect(0, 0, W, H);
            }

            // Vignette
            ctx.globalAlpha = alpha * 0.3;
            const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
            grad.addColorStop(0, 'transparent');
            grad.addColorStop(1, 'rgba(0,0,0,0.8)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            ctx.globalAlpha = 1;
            rafRef.current = requestAnimationFrame(draw);
        };

        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
    }, [active, duration]);

    if (!visible) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                pointerEvents: 'none',
                width: '100vw',
                height: '100vh',
            }}
        />
    );
}