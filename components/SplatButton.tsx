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
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        maxWidth: 280,
        aspectRatio: "3 / 1",
        margin: "0 auto",
        textDecoration: "none",
      }}
    >
      <img
        src="/start-designing-splat.svg"
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "fill",
          transform: "translateY(-8px)",
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.18))",
        }}
      />
      <span
        style={{
          position: "relative",
          color: "#1a1a1a",
          fontWeight: 900,
          fontSize: 24,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
    </Link>
  );
}
