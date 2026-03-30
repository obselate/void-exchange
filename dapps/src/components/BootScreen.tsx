import { useState, useEffect } from "react";

/**
 * CRT power-on effect: a bright scanline sweeps top→bottom
 * revealing the page underneath, then the overlay unmounts.
 */
export function BootScreen({ children }: { children: React.ReactNode }) {
    const [phase, setPhase] = useState<"sweep" | "done">("sweep");

    useEffect(() => {
        const timer = setTimeout(() => setPhase("done"), 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {children}
            {phase === "sweep" && <div className="crt-boot-overlay" />}
        </>
    );
}
