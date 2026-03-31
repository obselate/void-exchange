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
    minInput: bigint;
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
    if (s === 0n || x === 0n || y === 0n) return 0n;
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

function stableOutput(reserveIn: bigint, reserveOut: bigint, amp: bigint, netIn: bigint, targetIn: bigint, targetOut: bigint): bigint {
    // Normalize reserves by target ratio so the curve's peg point matches the
    // intended market ratio, not 1:1. At balance: normIn == normOut.
    const normIn = reserveIn * targetOut;
    const normOut = reserveOut * targetIn;
    const normNetIn = netIn * targetOut;

    const d = stableGetD(normIn, normOut, amp);
    const xNew = normIn + normNetIn;
    const yNew = stableGetY(xNew, d, amp);
    const rawNorm = normOut - yNew;

    // Denormalize: divide by targetIn (the output token's scaling factor)
    // Integer division already rounds down conservatively — no extra -1 needed
    return rawNorm / targetIn;
}

// ============================================================
// Dynamic fee + bonus (mirrors Move contract)
// ============================================================

function computeImbalance(reserveIn: bigint, reserveOut: bigint, targetIn: bigint, targetOut: bigint): bigint {
    // Cross-product comparison: at balance, reserveIn * targetOut == reserveOut * targetIn
    const actualCross = reserveIn * targetOut;
    const targetCross = reserveOut * targetIn;
    const crossSum = actualCross + targetCross;
    if (crossSum === 0n) return 0n;
    const crossDiff = actualCross > targetCross ? actualCross - targetCross : targetCross - actualCross;
    return crossDiff * BPS_DENOM / crossSum;
}

function computeFee(
    amountIn: bigint, baseFee: bigint, imbalanceBps: bigint,
    isWorsening: boolean, surgeBps: bigint,
): { fee: bigint; effectiveBps: bigint } {
    let fee: bigint;
    let effectiveBps: bigint;
    if (!isWorsening || surgeBps === 0n) {
        fee = amountIn * baseFee / BPS_DENOM;
        effectiveBps = baseFee;
    } else {
        const surge = imbalanceBps * surgeBps / BPS_DENOM;
        effectiveBps = baseFee + surge;
        fee = amountIn * effectiveBps / BPS_DENOM;
    }
    // Minimum fee of 1 for any trade when fees are configured
    if (fee === 0n && baseFee > 0n) fee = 1n;
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

function calcPriceImpact(resIn: bigint, resOut: bigint, amp: bigint, netIn: bigint, amtOut: bigint, targetIn: bigint, targetOut: bigint): bigint {
    if (netIn === 0n || amtOut === 0n) return 0n;
    // Marginal rate from StableSwap curve (output for 1 unit), not naive resOut/resIn
    const marginalOut = stableOutput(resIn, resOut, amp, 1n, targetIn, targetOut);
    if (marginalOut === 0n) return 0n;
    const SCALE = 100_000_000n;
    const spot = marginalOut * SCALE; // per 1 unit in
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
        const targetIn = BigInt(isAForB ? config.targetA : config.targetB);
        const targetOut = BigInt(isAForB ? config.targetB : config.targetA);
        const amp = BigInt(config.amp);
        const baseFee = BigInt(config.feeBps);
        const surgeBps = BigInt(config.surgeBps);
        const bonusBps = BigInt(config.bonusBps);
        const feePoolOut = BigInt(isAForB ? config.feePoolB : config.feePoolA);

        // Worsening = selling the side that's already oversupplied relative to target
        const actualCross = reserveIn * targetOut;
        const targetCross = reserveOut * targetIn;
        const isWorsening = actualCross >= targetCross;
        const isRebalancing = !isWorsening;

        const imbalanceBps = computeImbalance(reserveIn, reserveOut, targetIn, targetOut);

        const { fee: feeAmount, effectiveBps } = computeFee(
            amountIn, baseFee, imbalanceBps, isWorsening, surgeBps,
        );
        const netIn = amountIn - feeAmount;
        if (netIn <= 0n) return null;

        const amountOut = stableOutput(reserveIn, reserveOut, amp, netIn, targetIn, targetOut);
        if (amountOut >= reserveOut || amountOut === 0n) return null;

        const bonus = computeBonus(amountOut, imbalanceBps, isWorsening, bonusBps, feePoolOut, feeAmount);
        const totalOutput = amountOut + bonus;

        const priceImpactBps = calcPriceImpact(reserveIn, reserveOut, amp, netIn, amountOut, targetIn, targetOut);

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
            const mOut = stableOutput(reserveIn, reserveOut, amp, mNet, targetIn, targetOut);
            if (mOut === 0n || mOut >= reserveOut) {
                hi = mid - 1n;
            } else {
                const mImpact = calcPriceImpact(reserveIn, reserveOut, amp, mNet, mOut, targetIn, targetOut);
                if (mImpact <= maxImpact) {
                    best = mid;
                    lo = mid + 1n;
                } else {
                    hi = mid - 1n;
                }
            }
        }

        // Min input: smallest amount that produces >= 1 unit of output
        let minLo = 1n;
        let minHi = reserveIn;
        let minBest = 0n;
        for (let i = 0; i < 50; i++) {
            if (minLo > minHi) break;
            const mid = minLo + (minHi - minLo) / 2n;
            const { fee: mFee } = computeFee(mid, baseFee, imbalanceBps, isWorsening, surgeBps);
            const mNet = mid - mFee;
            if (mNet <= 0n) { minLo = mid + 1n; continue; }
            const mOut = stableOutput(reserveIn, reserveOut, amp, mNet, targetIn, targetOut);
            if (mOut >= 1n && mOut < reserveOut) {
                minBest = mid;
                minHi = mid - 1n;
            } else {
                minLo = mid + 1n;
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
            minInput: minBest,
            isRebalancing,
        };
    }, [config, direction, amountIn]);

    return { data: quote, isLoading: false };
}
