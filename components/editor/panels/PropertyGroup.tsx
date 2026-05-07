"use client";

/**
 * PropertyGroup.tsx
 *
 * EM PALAVRAS SIMPLES: caixinha que agrupa propriedades (ex:
 * "Posicao", "Tamanho", "Texto"). Voce clica no titulo pra esconder
 * ou mostrar as propriedades de dentro.
 *
 * TECNICAMENTE: collapsible section com chevron. Estado interno
 * (useState) — defaultOpen prop pra abrir/fechar inicial.
 */
import { useState } from "react";

interface Props {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function PropertyGroup({ title, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section style={sectionStyle}>
      <button onClick={() => setOpen(!open)} style={headerStyle}>
        <span style={chevronStyle}>{open ? "▼" : "▶"}</span>
        <span>{title}</span>
      </button>
      {open && <div style={bodyStyle}>{children}</div>}
    </section>
  );
}

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  borderBottom: "1px solid rgba(212,168,67,0.08)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "transparent",
  border: "none",
  color: "#8a8a8a",
  cursor: "pointer",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  padding: "10px 8px",
  textAlign: "left",
  width: "100%",
  fontFamily: "inherit",
};

const chevronStyle: React.CSSProperties = {
  fontSize: 8,
  color: "#5a5a5a",
};

const bodyStyle: React.CSSProperties = {
  padding: "0 8px 12px 8px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
