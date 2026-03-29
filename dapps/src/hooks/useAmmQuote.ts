import { useMemo } from "react";
import { AmmPoolData } from "./useAmmPool";

export type SwapQuote = {
    amountOut: bigint;
    feeAmount: bigint;
    effectiveFeeBps: bigint;
    bonus: bigint;
    totalOutput: bigint;
    priceImpactBps: bigint;
    maxInput: bigint;
    isRebalancing: boolean;
};

const BPS_DENOM = 10_000n;
const N_COINS = 2n;
const MAX_ITER = 64;

// ============================================================
// StableSwap math (mirrors the Move contract)
// ============================================================

function stableGetD(x: bigint, y: bigint, amp: bigint): bigint {
    const s = x + y;
    if (s === 0n) return 0n;
    const ann = amp * N_COINS;
    let d = s;
    for (let i = 0; i < MAX_ITER; i++) {
        let dP = d;
        dP = dP * d / (x * N_COINS);
        dP = dP * d / (y * N_COINS);
        const dPrev = d;
        d = (ann * s + N_COINS * dP) * d / ((ann - 1n) * d + (N_COINS + 1n) * dP);
        const diff = d > dPrev ? d - dPrev : dPrev - d;
        if (diff <= 1n) return d;
    }
    return d;
}

function stableGetY(xNew: bigint, d: bigint, amp: bigint): bigint {
    const ann = amp * N_COINS;
    const c = d * d / (xNew * N_COINS) * d / (ann * N_COINS);
    const b = xNew + d / ann;
    let y = d;
    for (let i = 0; i < MAX_ITER; i++) {
        const yPrev = y;
        y = (y * y + c) / (2n * y + b - d);
        const diff = y > yPrev ? y - yPrev : yPrev - y;
        if (diff <= 1n) return y;
    }
    return y;
}

function stableOutput(reserveIn: bigint, reserveOut: bigint, amp: bigint, netIn: bigint): bigint {
    const d = stableGetD(reserveIn, reserveOut, amp);
    const xNew = reserveIn + netIn;
    const yNew = stableGetY(xNew, d, amp);
    const raw = reserveOut - yNew;
    return raw > 0n ? raw - 1n : 0n;
}

// ============================================================
// Dynamic fee + bonus (mirrors Move contract)
// ============================================================

function computeImbalance(reserveIn: bigint, reserveOut: bigint): bigint {
    const total = reserveIn + reserveOut;
    if (total === 0n) return 0n;
    const diff = reserveIn > reserveOut ? reserveIn - reserveOut : reserveOut - reserveIn;
    return diff * BPS_DENOM / total;
}

function computeFee(
    amountIn: bigint, baseFee: bigint, imbalanceBps: bigint,
    isWorsening: boolean, surgeBps: bigint,
): { fee: bigint; effectiveBps: bigint } {
    if (!isWorsening || surgeBps === 0n) {
        const fee = amountIn * baseFee / BPS_DENOM;
        return { fee, effectiveBps: baseFee };
    }
    const surge = imbalanceBps * surgeBps / BPS_DENOM;
    const effectiveBps = baseFee + surge;
    const fee = amountIn * effectiveBps / BPS_DENOM;
    return { fee, effectiveBps };
}

function computeBonus(
    amountOut: bigint, imbalanceBps: bigint,
    isWorsening: boolean, bonusBps: bigint, feePoolOut: bigint, fee: bigint,
): bigint {
    if (isWorsening || bonusBps === 0n) return 0n;
    const bonusRate = imbalanceBps * bonusBps / BPS_DENOM;
    const rawBonus = amountOut * bonusRate / BPS_DENOM;
    let capped = rawBonus > feePoolOut ? feePoolOut : rawBonus;
    const feeCap = fee * 3n;
    if (capped > feeCap) capped = feeCap;
    return capped;
}

function calcPriceImpact(resIn: bigint, resOut: bigint, netIn: bigint, amtOut: bigint): bigint {
    if (netIn === 0n || amtOut === 0n) return 0n;
    const SCALE = 100_000_000n;
    const spot = resOut * SCALE / resIn;
    const effective = amtOut * SCALE / netIn;
    if (effective >= spot) return 0n;
    return (spot - effective) * BPS_DENOM / spot;
}

// ============================================================
// Hook
// ============================================================

export function useAmmQuote(
    config: AmmPoolData | null,
    direction: "a_for_b" | "b_for_a",
    amountIn: bigint,
): { data: SwapQuote | null; isLoading: false } {
    const quote = useMemo((): SwapQuote | null => {
        if (!config || amountIn <= 0n) return null;

        const isAForB = direction === "a_for_b";
        const reserveIn = BigInt(isAForB ? config.reserveA : config.reserveB);
        const reserveOut = BigInt(isAForB ? config.reserveB : config.reserveA);
        const amp = BigInt(config.amp);
        const baseFee = BigInt(config.feeBps);
        const surgeBps = BigInt(config.surgeBps);
        const bonusBps = BigInt(config.bonusBps);
        const feePoolOut = BigInt(isAForB ? config.feePoolB : config.feePoolA);

        // Worsening = selling the side that already has more
        const isWorsening = reserveIn >= reserveOut;
        const isRebalancing = !isWorsening;

        const imbalanceBps = computeImbalance(reserveIn, reserveOut);

        const { fee: feeAmount, effectiveBps } = computeFee(
            amountIn, baseFee, imbalanceBps, isWorsening, surgeBps,
        );
        const netIn = amountIn - feeAmount;
        if (netIn <= 0n) return null;

        const amountOut = stableOutput(reserveIn, reserveOut, amp, netIn);
        if (amountOut >= reserveOut || amountOut === 0n) return null;

        const bonus = computeBonus(amountOut, imbalanceBps, isWorsening, bonusBps, feePoolOut, feeAmount);
        const totalOutput = amountOut + bonus;

        const priceImpactBps = calcPriceImpact(reserveIn, reserveOut, netIn, amountOut);

        // Max input: largest amount where output > 0 and impact < 50%
        const maxImpact = 5000n;
        let lo = 1n;
        let hi = reserveIn;
        let best = 0n;
        for (let i = 0; i < 50; i++) {
            if (lo > hi) break;
            const mid = lo + (hi - lo) / 2n;
            const { fee: mFee } = computeFee(mid, baseFee, imbalanceBps, isWorsening, surgeBps);
            const mNet = mid - mFee;
            if (mNet <= 0n) { hi = mid - 1n; continue; }
            const mOut = stableOutput(reserveIn, reserveOut, amp, mNet);
            if (mOut === 0n || mOut >= reserveOut) {
                hi = mid - 1n;
            } else {
                const mImpact = calcPriceImpact(reserveIn, reserveOut, mNet, mOut);
                if (mImpact <= maxImpact) {
                    best = mid;
                    lo = mid + 1n;
                } else {
                    hi = mid - 1n;
                }
            }
        }

        return {
            amountOut,
            feeAmount,
            effectiveFeeBps: effectiveBps,
            bonus,
            totalOutput,
            priceImpactBps,
            maxInput: best,
            isRebalancing,
        };
    }, [config, direction, amountIn]);

    return { data: quote, isLoading: false };
}
