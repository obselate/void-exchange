import { useSwapEvents } from "../hooks/useSwapEvents";
import { itemName } from "../config";

type Props = {
    poolId: string;
    typeIdA: string;
    typeIdB: string;
};

export function RecentActivity({ poolId, typeIdA, typeIdB }: Props) {
    const { data: events, isLoading } = useSwapEvents(poolId);
    const nameA = itemName(typeIdA);
    const nameB = itemName(typeIdB);

    return (
        <div className="terminal-panel muted" data-label="Recent Activity">
            {isLoading ? (
                <div style={{ fontSize: 11, color: "var(--accent)", padding: "8px 0", letterSpacing: "0.1em" }}>
                    Loading activity...
                </div>
            ) : !events?.length ? (
                <div style={{ fontSize: 11, color: "#555", padding: "8px 0" }}>
                    No recent activity
                </div>
            ) : (
                events.map((ev, i) => {
                    const isSellA = ev.direction === "sell_a";
                    const time = ev.timestamp
                        ? new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "—";
                    return (
                        <div key={`${ev.timestamp}-${ev.direction}-${ev.amountIn}`} className="activity-row">
                            <span className="activity-time">{time}</span>
                            <span className={`activity-type ${isSellA ? "sell" : "buy"}`}>
                                {isSellA ? "SELL" : "BUY"}
                            </span>
                            <span className="activity-detail">
                                <strong>{ev.amountIn}</strong> {isSellA ? nameA : nameB}
                                {" → "}
                                <strong>{ev.amountOut}</strong> {isSellA ? nameB : nameA}
                            </span>
                            {ev.bonus > 0 && (
                                <span className="activity-bonus">+{ev.bonus} bonus</span>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}
