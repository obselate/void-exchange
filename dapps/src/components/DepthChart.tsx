import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";

export type DepthChartHandle = {
    flash: (side: "a" | "b", deltaA: number, deltaB: number) => void;
};

type Props = {
    reserveA: number;
    reserveB: number;
    targetA: number;
    targetB: number;
    amp: number;
    nameA: string;
    nameB: string;
};

const BALANCED_THRESHOLD = 5; // percent

// Amplitude → curve exponent. Log scale: amp 1→3.5, amp 200→1.0
function ampExponent(amp: number): number {
    const clamped = Math.max(1, Math.min(amp, 200));
    const t = Math.log(clamped) / Math.log(200);
    return 3.5 - t * 2.5;
}

function calcNormMidFraction(resA: number, resB: number, tA: number, tB: number): number {
    const normA = resA / (tA || 1);
    const normB = resB / (tB || 1);
    const total = normA + normB;
    return total > 0 ? normA / total : 0.5;
}

function calcImbalancePct(resA: number, resB: number, tA: number, tB: number): number {
    const ac = resA * tB;
    const tc = resB * tA;
    const s = ac + tc;
    if (s === 0) return 0;
    return (Math.abs(ac - tc) * 10000 / s) / 100;
}

function isAOversupplied(resA: number, resB: number, tA: number, tB: number): boolean {
    return resA * tB > resB * tA;
}

export const DepthChart = forwardRef<DepthChartHandle, Props>(function DepthChart(
    { reserveA, reserveB, targetA, targetB, amp, nameA, nameB },
    ref,
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    // Mutable animation state — not in React state to avoid re-renders
    const stateRef = useRef({
        currentMidX: 0,
        goalMidX: 0,
        midVelocity: 0,
        flashA: 0,
        flashB: 0,
        initialized: false,
    });

    // Delta floater refs
    const deltaARef = useRef<HTMLDivElement>(null);
    const deltaBRef = useRef<HTMLDivElement>(null);

    // Expose flash method to parent
    useImperativeHandle(ref, () => ({
        flash(side: "a" | "b", deltaA: number, deltaB: number) {
            const s = stateRef.current;
            if (side === "a") s.flashA = 1;
            else s.flashB = 1;
            showDelta(deltaARef.current, deltaA, "a");
            showDelta(deltaBRef.current, deltaB, "b");
        },
    }));

    // Update goal midpoint when reserves/targets change
    useEffect(() => {
        const W = (canvasRef.current?.width ?? 640);
        const goal = calcNormMidFraction(reserveA, reserveB, targetA, targetB) * W;
        const s = stateRef.current;
        s.goalMidX = goal;
        if (!s.initialized) {
            s.currentMidX = goal;
            s.initialized = true;
        }
    }, [reserveA, reserveB, targetA, targetB]);

    // Main draw function
    const draw = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
        const s = stateRef.current;
        ctx.clearRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = "#1a2332";
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 6]);
        for (const y of [H * 0.25, H * 0.5, H * 0.75]) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        ctx.setLineDash([]);

        const midX = s.currentMidX;
        const bal = calcImbalancePct(reserveA, reserveB, targetA, targetB) <= BALANCED_THRESHOLD;
        const aOver = isAOversupplied(reserveA, reserveB, targetA, targetB);
        const imb = calcImbalancePct(reserveA, reserveB, targetA, targetB);
        const imbF = Math.min(imb / 40, 1);
        const exp = ampExponent(amp);

        // Build curve points
        const steps = 100;
        const peakH = H * 0.88;
        const ptsA: { x: number; y: number }[] = [];
        const ptsB: { x: number; y: number }[] = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            ptsA.push({ x: t * midX, y: H - Math.pow(t, exp) * peakH });
            ptsB.push({ x: midX + t * (W - midX), y: H - Math.pow(1 - t, exp) * peakH });
        }

        if (bal) {
            // Balanced: equal weight, green-tinted
            drawSide(ctx, ptsA, H, 200, 160, 60, 2, 6, 0.35, s.flashA);
            drawSide(ctx, ptsB, H, 30, 230, 200, 2, 6, 0.35, s.flashB);
        } else {
            // Imbalanced: asymmetric
            const oS = 2.5 + imbF * 1.5, oG = 8 + imbF * 12, oF = 0.4 + imbF * 0.25;
            const sS = 1.5 - imbF * 0.4, sG = 4 - imbF * 2, sF = 0.3 - imbF * 0.15;
            const hotR = 232 + imbF * 23, hotG = 122 - imbF * 30, hotB = 30 - imbF * 10;

            if (aOver) {
                drawSide(ctx, ptsA, H, hotR, hotG, hotB, oS, oG, oF, s.flashA);
                drawSide(ctx, ptsB, H, 0, 212, 255, sS, sG, sF, s.flashB);
            } else {
                drawSide(ctx, ptsA, H, 232, 122, 30, sS, sG, sF, s.flashA);
                drawSide(ctx, ptsB, H, 0, 230, 255, oS, oG, oF, s.flashB);
            }
        }

        // Target line
        const tMid = W * (targetA / (targetA + targetB));
        ctx.setLineDash([2, 8]); ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tMid, 0); ctx.lineTo(tMid, H); ctx.stroke();

        // Spread line
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = bal ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.15)";
        ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, H); ctx.stroke();
        ctx.setLineDash([]);
    }, [reserveA, reserveB, targetA, targetB, amp]);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctxRaw = canvas.getContext("2d");
        if (!ctxRaw) return;
        const ctx: CanvasRenderingContext2D = ctxRaw;
        const W = canvas.width;
        const H = canvas.height;

        function tick() {
            const dt = 1 / 60;
            const s = stateRef.current;

            // Spring physics
            const dx = s.goalMidX - s.currentMidX;
            s.midVelocity += (dx * 120 - s.midVelocity * 12) * dt;
            s.currentMidX += s.midVelocity * dt;

            // Decay flashes
            if (s.flashA > 0) s.flashA = Math.max(0, s.flashA - dt * 3);
            if (s.flashB > 0) s.flashB = Math.max(0, s.flashB - dt * 3);

            draw(ctx, W, H);
            animRef.current = requestAnimationFrame(tick);
        }

        animRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animRef.current);
    }, [draw]);

    // Derived display values
    const imb = calcImbalancePct(reserveA, reserveB, targetA, targetB);
    const bal = imb <= BALANCED_THRESHOLD;
    const aOver = isAOversupplied(reserveA, reserveB, targetA, targetB);
    const ratioRaw = reserveA > 0 && reserveB > 0 ? reserveA / reserveB : 1;
    const fmtRatio = (v: number) => v >= 100 ? Math.round(v).toString() : v >= 10 ? v.toFixed(1) : v.toFixed(2);
    const ratioDisplay = ratioRaw >= 1 ? `${fmtRatio(ratioRaw)}:1` : `1:${fmtRatio(1 / ratioRaw)}`;
    const ratioColor = bal ? "#00ff88" : aOver ? "#e87a1e" : "#00d4ff";

    function tagClass(isMySideOver: boolean): string {
        if (bal) return "depth-label-tag balanced";
        return isMySideOver ? "depth-label-tag over" : "depth-label-tag scarce";
    }

    function tagText(isMySideOver: boolean): string {
        if (bal) return "BALANCED";
        return isMySideOver ? "OVERSUPPLIED" : "SCARCE";
    }

    return (
        <div className="depth-chart">
            {/* Ratio + status badge */}
            <div style={{ textAlign: "center", marginBottom: 4, fontFamily: '"Frontier Disket Mono", monospace' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: ratioColor, letterSpacing: "0.05em" }}>
                    {ratioDisplay}
                </span>
                <span className={`depth-status-badge ${bal ? "balanced" : "imbalanced"}`}>
                    {bal ? "BALANCED" : `${imb.toFixed(1)}% OFF`}
                </span>
            </div>

            {/* Canvas */}
            <canvas ref={canvasRef} width={640} height={180} />

            {/* Labels with tags and delta floaters */}
            <div className="depth-chart-labels">
                <span className="depth-label-a" style={{
                    opacity: bal ? 1 : aOver ? 1 : 0.5,
                    fontWeight: bal ? 500 : aOver ? 700 : 400,
                    position: "relative",
                }}>
                    <div className="depth-label-delta left" ref={deltaARef} />
                    {reserveA.toLocaleString()} {nameA}
                    <span className={tagClass(aOver)}>{tagText(aOver)}</span>
                </span>
                <span className="depth-label-b" style={{
                    opacity: bal ? 1 : !aOver ? 1 : 0.5,
                    fontWeight: bal ? 500 : !aOver ? 700 : 400,
                    position: "relative",
                }}>
                    <div className="depth-label-delta right" ref={deltaBRef} />
                    {reserveB.toLocaleString()} {nameB}
                    <span className={tagClass(!aOver)}>{tagText(!aOver)}</span>
                </span>
            </div>
        </div>
    );
});

// ─── Drawing helpers ────────────────────────────────────────

function flashedColor(r: number, g: number, b: number, f: number): [number, number, number] {
    return [
        Math.round(r + (Math.min(255, r + 60) - r) * f),
        Math.round(g + (Math.min(255, g + 60) - g) * f),
        Math.round(b + (Math.min(255, b + 30) - b) * f),
    ];
}

function drawSide(
    ctx: CanvasRenderingContext2D,
    pts: { x: number; y: number }[],
    H: number,
    bR: number, bG: number, bB: number,
    sw: number, glow: number, fillOp: number,
    flash: number,
) {
    if (pts.length < 2) return;
    const [r, g, b] = flashedColor(bR, bG, bB, flash);
    const stroke = `rgb(${r},${g},${b})`;

    ctx.save();

    // Fill
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `rgba(${r},${g},${b},${fillOp + flash * 0.35})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0.02)`);
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke with glow
    ctx.shadowColor = stroke;
    ctx.shadowBlur = glow + flash * 20;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
        else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = sw + flash * 2;
    ctx.stroke();

    ctx.restore();
}

function showDelta(el: HTMLDivElement | null, amount: number, side: "a" | "b") {
    if (!el) return;
    el.style.color = side === "a" ? "#e87a1e" : "#00d4ff";
    const sign = amount >= 0 ? "+" : "−";
    el.textContent = `${sign}${Math.abs(amount).toLocaleString()}`;
    el.classList.remove("active");
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add("active");
}
