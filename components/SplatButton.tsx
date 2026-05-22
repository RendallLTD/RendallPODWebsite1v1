"use client";

import Link from "next/link";

type Props = {
  href: string;
  children: React.ReactNode;
};

export default function SplatButton({ href, children }: Props) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 32px",
        background: "#1a1a1a",
        color: "#fff",
        fontFamily: '"PP Neue Machina", "Hack", monospace',
        fontSize: 18,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        textDecoration: "none",
        border: "none",
        whiteSpace: "nowrap",
      }}
    >
      [ {children} →&nbsp;]
    </Link>
  );
}
