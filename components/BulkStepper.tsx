import Link from "next/link";
import { STEP_COLORS } from "@/lib/bulk-steps";

type Props = { step: 1 | 2 | 3 };

const LABELS = ["Pick a blank", "Design", "Add recipients"] as const;
const HREFS = ["/catalog", null, "/bulk-start?step=3"] as const;

export default function BulkStepper({ step }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        padding: "16px 24px",
        background: "#fafafa",
        borderBottom: "1px solid #e5e5e5",
      }}
    >
      {LABELS.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        const stepColor = STEP_COLORS[i];
        const href = HREFS[i];
        const pill = (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 999,
              background: active ? stepColor : done ? stepColor : "#fff",
              opacity: done ? 0.55 : 1,
              color: active || done ? "#fff" : "#666",
              border: active || done ? "none" : "1px solid #e5e5e5",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: active || done ? "rgba(255,255,255,0.25)" : "#f0f0f0",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
              }}
            >
              {done ? "✓" : n}
            </span>
            {label}
          </div>
        );
        return done && href ? (
          <Link key={label} href={href} style={{ textDecoration: "none" }}>
            {pill}
          </Link>
        ) : (
          <div key={label}>{pill}</div>
        );
      })}
    </div>
  );
}
