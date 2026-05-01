"use client";

// ProvablyFairModal — Premium AAA compartilhado por todos os jogos
// F5.C — 30/04/2026
//
// Refatoracao completa com 3 abas:
//   1. COMO FUNCIONA — explicacao didatica passo-a-passo com diagramas SVG
//   2. ESTA JOGADA — dados PF do round atual (server seed hash, client seed, nonce)
//                     + animacao de revelacao do server seed (slide reveal)
//                     + side-by-side hash comparison
//   3. VERIFICAR ANTIGA — calculadora retroativa: cole hash + seed revelada → valida
//
// Features novas (vs V0 663L):
//   - Sistema de 3 abas com layoutId smooth transition
//   - Animacao de revelacao do server seed (ofuscado → reveal slide)
//   - Diagrama SVG do fluxo PF (commitment → bet → reveal → verify)
//   - Calculadora retroativa standalone (verifica rounds antigos)
//   - Copy-to-clipboard premium em todos os campos com feedback visual
//   - Status badge premium (NAO VERIFICADO / VERIFICADO ✓ / FALHOU ✗)
//   - Historico de seeds com sparkline de nonces usados
//   - 100% compativel com API antiga (mantem PFData, SeedRecord, callbacks)

import { useState, useCallback, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameModal from "./GameModal";

// ============================================================
// TIPOS PUBLICOS (mantidos do V0 — zero breaking changes)
// ============================================================
export interface PFData {
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  serverSeed: string;
  isValid: boolean | null;
}

export interface SeedRecord {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  revealedAt: string;
}

export interface ProvablyFairModalProps {
  open: boolean;
  onClose: () => void;
  lang?: "br" | "in";
  pfData: PFData;
  seedHistory?: SeedRecord[];
  onClientSeedChange: (seed: string) => void;
  onVerify: () => Promise<void>;
  onRotateSeed?: () => Promise<void>;
  onCopy?: (text: string, field: string) => void;
  verifying?: boolean;
  rotating?: boolean;
  escPush?: (id: string, close: () => void) => void;
  escPop?: (id: string) => void;
  customExplanation?: ReactNode;
  clientSeedChanged?: boolean;
  unverifiedCount?: number;
  verifyDetails?: { committedHash: string; recalculatedHash: string; match: boolean } | null;
}

// ============================================================
// PALETA
// ============================================================
const GOLD = {
  primary: "#D4A843",
  light: "#FFD700",
  dark: "#8B6914",
  glow: "rgba(212,168,67,0.4)",
  glowSoft: "rgba(212,168,67,0.15)",
};
const EMERALD = {
  primary: "#00C853",
  light: "#00E676",
  glow: "rgba(0,230,118,0.4)",
  glowSoft: "rgba(0,230,118,0.12)",
};
const RED = {
  primary: "#FF4444",
  light: "#FF6B6B",
  glow: "rgba(255,68,68,0.35)",
};

// ============================================================
// TEXTOS BILINGUES
// ============================================================
const TEXTS = {
  br: {
    title: "PROVABLY FAIR",
    tabHow: "COMO FUNCIONA",
    tabCurrent: "ESTA JOGADA",
    tabVerify: "VERIFICAR ANTIGA",

    // Aba COMO FUNCIONA
    howIntro: "O Provably Fair garante que o resultado das jogadas e verificavel matematicamente. Nem voce nem o cassino podem trapacear.",
    step1Title: "1. ANTES DA JOGADA",
    step1Desc: "O servidor gera uma Server Seed secreta de 64 caracteres e te envia apenas o HASH (impressao digital). Voce salva este hash como prova.",
    step2Title: "2. DURANTE A JOGADA",
    step2Desc: "Cada aposta combina: HMAC-SHA256(serverSeed + clientSeed:nonce). O resultado e deterministico — voce nao pode prever, o cassino nao pode alterar.",
    step3Title: "3. APOS A JOGADA",
    step3Desc: "Quando voce solicita verificacao, o servidor revela a Server Seed original. Voce confirma: SHA256(seedRevelada) == hash salvo. Se baterem, prova matematica de honestidade.",
    step4Title: "4. CALCULADORA RETROATIVA",
    step4Desc: "Use a aba 'Verificar Antiga' para conferir qualquer rodada do historico. Cole o hash antigo + seed revelada → veja se bate.",

    // Aba ESTA JOGADA
    statusUnverified: "NAO VERIFICADO",
    statusVerified: "VERIFICADO",
    statusFailed: "FALHOU",
    serverSeedHashLabel: "Server Seed Hash (compromisso pre-jogo)",
    clientSeedLabel: "Client Seed (pode editar)",
    nonceLabel: "Nonce (numero da jogada)",
    serverSeedRevealedLabel: "Server Seed Revelada",
    serverSeedHidden: "•••••• ainda nao revelada — clique 'Rotacionar Seed' para revelar",
    verifyBtn: "VERIFICAR AGORA",
    verifyingBtn: "VERIFICANDO...",
    rotateBtn: "ROTACIONAR SEED (revelar)",
    rotatingBtn: "ROTACIONANDO...",
    rotateNote: "⚠️ Ao rotacionar: a seed atual e revelada e movida para o Historico. Uma nova seed secreta e gerada. Faca isso quando quiser auditar.",
    seedChanged: "Seed alterada — nonce resetou para 0",

    // Verify details
    verifyDetailsTitle: "DETALHES DA VERIFICACAO",
    committedLabel: "Hash comprometido (antes do jogo)",
    recalcLabel: "Hash recalculado (apos reveal)",
    matchOK: "Hashes IDENTICOS — o servidor nao alterou nada",
    matchFAIL: "Hashes DIFERENTES — possivel manipulacao",

    // Aba VERIFICAR ANTIGA
    verifyOldIntro: "Cole os dados de qualquer round antigo do seu historico para verificar se foi honesto.",
    verifyOldHashLabel: "Hash do server seed (do round antigo)",
    verifyOldSeedLabel: "Server seed revelada (do round antigo)",
    verifyOldHashPlaceholder: "Cole o hash de 64 caracteres aqui...",
    verifyOldSeedPlaceholder: "Cole a seed revelada aqui...",
    verifyOldBtn: "CALCULAR E COMPARAR",
    verifyOldCalculating: "CALCULANDO...",
    verifyOldResultMatch: "VERIFICADO — hashes coincidem perfeitamente",
    verifyOldResultMismatch: "FALHOU — hashes nao batem (suspeita)",
    verifyOldResultEmpty: "Preencha os 2 campos para verificar",

    // Historico
    seedHistoryTitle: "HISTORICO DE SEEDS REVELADAS",
    seedHistoryEmpty: "Nenhuma seed revelada ainda. Use 'Rotacionar Seed' para revelar a atual.",

    copied: "Copiado!",
    seedHint: "Min 4 / max 64 caracteres. Use algo aleatorio.",
    unverifiedBadge: "spins sem verificar",
  },
  in: {
    title: "PROVABLY FAIR",
    tabHow: "HOW IT WORKS",
    tabCurrent: "THIS GAME",
    tabVerify: "VERIFY OLD",

    howIntro: "Provably Fair guarantees that game outcomes are mathematically verifiable. Neither you nor the casino can cheat.",
    step1Title: "1. BEFORE THE GAME",
    step1Desc: "The server generates a 64-character secret Server Seed and sends you only the HASH (fingerprint). Save this hash as proof.",
    step2Title: "2. DURING THE GAME",
    step2Desc: "Each bet combines: HMAC-SHA256(serverSeed + clientSeed:nonce). Result is deterministic — you can't predict, the casino can't tamper.",
    step3Title: "3. AFTER THE GAME",
    step3Desc: "When you request verification, the server reveals the original Server Seed. Confirm: SHA256(revealedSeed) == saved hash. If they match, mathematical proof of fairness.",
    step4Title: "4. RETROACTIVE CALCULATOR",
    step4Desc: "Use 'Verify Old' tab to check any past round. Paste the old hash + revealed seed → see if they match.",

    statusUnverified: "UNVERIFIED",
    statusVerified: "VERIFIED",
    statusFailed: "FAILED",
    serverSeedHashLabel: "Server Seed Hash (pre-game commitment)",
    clientSeedLabel: "Client Seed (editable)",
    nonceLabel: "Nonce (game number)",
    serverSeedRevealedLabel: "Revealed Server Seed",
    serverSeedHidden: "•••••• not revealed yet — click 'Rotate Seed' to reveal",
    verifyBtn: "VERIFY NOW",
    verifyingBtn: "VERIFYING...",
    rotateBtn: "ROTATE SEED (reveal)",
    rotatingBtn: "ROTATING...",
    rotateNote: "⚠️ When rotating: current seed is revealed and moved to History. A new secret seed is generated. Do this when you want to audit.",
    seedChanged: "Seed changed — nonce reset to 0",

    verifyDetailsTitle: "VERIFICATION DETAILS",
    committedLabel: "Committed hash (before game)",
    recalcLabel: "Recalculated hash (after reveal)",
    matchOK: "Hashes IDENTICAL — the server did not tamper",
    matchFAIL: "Hashes DIFFER — possible tampering",

    verifyOldIntro: "Paste data from any past round in your history to verify it was fair.",
    verifyOldHashLabel: "Server seed hash (from old round)",
    verifyOldSeedLabel: "Revealed server seed (from old round)",
    verifyOldHashPlaceholder: "Paste 64-char hash here...",
    verifyOldSeedPlaceholder: "Paste revealed seed here...",
    verifyOldBtn: "CALCULATE & COMPARE",
    verifyOldCalculating: "CALCULATING...",
    verifyOldResultMatch: "VERIFIED — hashes match perfectly",
    verifyOldResultMismatch: "FAILED — hashes don't match (suspicious)",
    verifyOldResultEmpty: "Fill both fields to verify",

    seedHistoryTitle: "REVEALED SEEDS HISTORY",
    seedHistoryEmpty: "No seeds revealed yet. Use 'Rotate Seed' to reveal the current one.",

    copied: "Copied!",
    seedHint: "Min 4 / max 64 characters. Use something random.",
    unverifiedBadge: "unverified spins",
  },
};

// ============================================================
// SHA256 helper (Web Crypto API)
// ============================================================
async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function ProvablyFairModal({
  open,
  onClose,
  lang = "br",
  pfData,
  seedHistory = [],
  onClientSeedChange,
  onVerify,
  onRotateSeed,
  onCopy,
  verifying = false,
  rotating = false,
  escPush,
  escPop,
  customExplanation,
  clientSeedChanged = false,
  unverifiedCount,
  verifyDetails,
}: ProvablyFairModalProps) {
  const T = TEXTS[lang];
  const [activeTab, setActiveTab] = useState<"how" | "current" | "verify">("current");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Travar fechamento durante operacoes
  const safeClose = useCallback(() => {
    if (verifying || rotating) return;
    onClose();
  }, [onClose, verifying, rotating]);

  const handleCopy = useCallback((text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
    onCopy?.(text, field);
  }, [onCopy]);

  // Status do round atual
  const status: "unverified" | "verified" | "failed" =
    pfData.isValid === true ? "verified" :
    pfData.isValid === false ? "failed" :
    "unverified";

  return (
    <GameModal
      open={open}
      onClose={safeClose}
      title={T.title}
      icon="/assets/shared/icons/icon-provably-fair.png"
      escId="provably-fair-modal"
      escPush={escPush}
      escPop={escPop}
      width="clamp(380px, 70vw, 880px)"
      tabs={[
        { id: "how", label: T.tabHow },
        { id: "current", label: T.tabCurrent },
        { id: "verify", label: T.tabVerify },
      ]}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as any)}
    >
      <AnimatePresence mode="wait">
        {activeTab === "how" && (
          <motion.div
            key="tab-how"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
          >
            <HowItWorksTab T={T} customExplanation={customExplanation} />
          </motion.div>
        )}

        {activeTab === "current" && (
          <motion.div
            key="tab-current"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
          >
            <CurrentGameTab
              T={T}
              pfData={pfData}
              status={status}
              onClientSeedChange={onClientSeedChange}
              onVerify={onVerify}
              onRotateSeed={onRotateSeed}
              onCopy={handleCopy}
              copiedField={copiedField}
              verifying={verifying}
              rotating={rotating}
              clientSeedChanged={clientSeedChanged}
              unverifiedCount={unverifiedCount}
              verifyDetails={verifyDetails}
              seedHistory={seedHistory}
              lang={lang}
            />
          </motion.div>
        )}

        {activeTab === "verify" && (
          <motion.div
            key="tab-verify"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
          >
            <VerifyOldTab T={T} />
          </motion.div>
        )}
      </AnimatePresence>
    </GameModal>
  );
}

// ============================================================
// ABA 1: COMO FUNCIONA (didatico com diagrama SVG)
// ============================================================
function HowItWorksTab({ T, customExplanation }: { T: any; customExplanation?: ReactNode }) {
  const steps = [
    { num: "1", title: T.step1Title, desc: T.step1Desc, color: GOLD.light, icon: "🔒" },
    { num: "2", title: T.step2Title, desc: T.step2Desc, color: EMERALD.light, icon: "⚡" },
    { num: "3", title: T.step3Title, desc: T.step3Desc, color: GOLD.primary, icon: "🔓" },
    { num: "4", title: T.step4Title, desc: T.step4Desc, color: EMERALD.primary, icon: "✓" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(14px, 1.8vw, 22px)" }}>
      {/* INTRO */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "clamp(14px, 1.8vw, 20px)",
          background: "linear-gradient(135deg, rgba(20,16,10,0.95) 0%, rgba(8,7,6,0.98) 100%)",
          border: `1.5px solid ${GOLD.dark}`,
          borderRadius: "10px",
          boxShadow: [
            `0 0 0 1px ${GOLD.glowSoft}`,
            `0 0 20px ${GOLD.glow}`,
            "inset 0 1px 1px rgba(255,215,0,0.06)",
          ].join(", "),
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(12px, 1.2vw, 14px)",
            color: "rgba(255,255,255,0.78)",
            lineHeight: 1.6,
          }}
        >
          {T.howIntro}
        </div>
      </motion.div>

      {/* DIAGRAMA SVG do fluxo */}
      <FlowDiagram lang={T.tabHow === "COMO FUNCIONA" ? "br" : "in"} />

      {/* PASSOS NUMERADOS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1vw, 12px)" }}>
        {steps.map((step, idx) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            style={{
              display: "flex",
              gap: "clamp(10px, 1.2vw, 16px)",
              padding: "clamp(12px, 1.4vw, 18px)",
              background: "rgba(15,12,8,0.6)",
              border: `1px solid ${GOLD.glowSoft}`,
              borderRadius: "10px",
              transition: "border-color 0.2s",
            }}
            whileHover={{ borderColor: step.color, transition: { duration: 0.2 } }}
          >
            {/* Numero gigante */}
            <div
              style={{
                flexShrink: 0,
                width: "clamp(40px, 4vw, 52px)",
                height: "clamp(40px, 4vw, 52px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(18px, 2vw, 26px)",
                fontWeight: 800,
                color: step.color,
                background: `${step.color}15`,
                border: `1.5px solid ${step.color}50`,
                borderRadius: "8px",
                textShadow: `0 0 12px ${step.color}80`,
              }}
            >
              {step.num}
            </div>

            {/* Conteudo */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "clamp(11px, 1.1vw, 13px)",
                  fontWeight: 700,
                  color: step.color,
                  letterSpacing: "1.5px",
                }}
              >
                {step.title}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "clamp(11px, 1.1vw, 13px)",
                  color: "rgba(255,255,255,0.72)",
                  lineHeight: 1.55,
                }}
              >
                {step.desc}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {customExplanation && (
        <div style={{ marginTop: "clamp(8px, 1vw, 12px)" }}>
          {customExplanation}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SUBCOMPONENT: Diagrama SVG do fluxo PF
// ============================================================
function FlowDiagram({ lang }: { lang: "br" | "in" }) {
  const labels = lang === "br"
    ? { commit: "COMPROMISSO", play: "JOGADAS", reveal: "REVELACAO", verify: "VERIFICACAO" }
    : { commit: "COMMITMENT", play: "PLAYS", reveal: "REVEAL", verify: "VERIFY" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        padding: "clamp(14px, 2vw, 24px)",
        background: "linear-gradient(180deg, rgba(15,12,8,0.8) 0%, rgba(8,7,6,0.95) 100%)",
        border: `1.5px solid ${GOLD.glowSoft}`,
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <svg viewBox="0 0 720 110" style={{ width: "100%", height: "auto" }}>
        {/* Linha base */}
        <line x1="40" y1="55" x2="680" y2="55" stroke={GOLD.dark} strokeWidth="2" strokeDasharray="4,4" />

        {/* 4 nos */}
        {[
          { x: 80, color: GOLD.light, label: labels.commit, sub: "SHA256(seed)" },
          { x: 280, color: EMERALD.light, label: labels.play, sub: "HMAC(seed,client:n)" },
          { x: 480, color: GOLD.primary, label: labels.reveal, sub: "seed: abc123..." },
          { x: 660, color: EMERALD.primary, label: labels.verify, sub: "SHA256 match?" },
        ].map((node, idx) => (
          <g key={idx}>
            {/* Glow externo pulsando */}
            <circle cx={node.x} cy="55" r="22" fill={`${node.color}20`}>
              <animate attributeName="r" values="22;28;22" dur="3s" repeatCount="indefinite" begin={`${idx * 0.5}s`} />
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" begin={`${idx * 0.5}s`} />
            </circle>
            {/* Circulo */}
            <circle cx={node.x} cy="55" r="14" fill={`${node.color}30`} stroke={node.color} strokeWidth="2" />
            <circle cx={node.x} cy="55" r="6" fill={node.color} />
            {/* Label superior */}
            <text x={node.x} y="22" textAnchor="middle" fill={node.color}
              style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", fontWeight: 700, letterSpacing: "1.2px" }}>
              {node.label}
            </text>
            {/* Sub-label inferior */}
            <text x={node.x} y="92" textAnchor="middle" fill="rgba(255,255,255,0.5)"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px" }}>
              {node.sub}
            </text>
          </g>
        ))}

        {/* Setas */}
        {[180, 380, 580].map((x, idx) => (
          <g key={idx}>
            <path d={`M ${x} 55 L ${x + 8} 50 L ${x + 8} 60 Z`} fill={GOLD.primary} opacity="0.6">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" begin={`${idx * 0.3}s`} />
            </path>
          </g>
        ))}
      </svg>
    </motion.div>
  );
}

// ============================================================
// ABA 2: ESTA JOGADA (round atual + reveal animado)
// ============================================================
function CurrentGameTab({
  T,
  pfData,
  status,
  onClientSeedChange,
  onVerify,
  onRotateSeed,
  onCopy,
  copiedField,
  verifying,
  rotating,
  clientSeedChanged,
  unverifiedCount,
  verifyDetails,
  seedHistory,
  lang,
}: {
  T: any;
  pfData: PFData;
  status: "unverified" | "verified" | "failed";
  onClientSeedChange: (seed: string) => void;
  onVerify: () => Promise<void>;
  onRotateSeed?: () => Promise<void>;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
  verifying: boolean;
  rotating: boolean;
  clientSeedChanged: boolean;
  unverifiedCount?: number;
  verifyDetails?: { committedHash: string; recalculatedHash: string; match: boolean } | null;
  seedHistory: SeedRecord[];
  lang: "br" | "in";
}) {
  const seedRevealed = !!pfData.serverSeed;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.5vw, 18px)" }}>
      {/* STATUS BADGE GIGANTE */}
      <StatusBadge status={status} T={T} unverifiedCount={unverifiedCount} />

      {/* SERVER SEED HASH (commitment) */}
      <PFField
        label={T.serverSeedHashLabel}
        value={pfData.serverSeedHash}
        copied={copiedField === "serverSeedHash"}
        onCopy={() => onCopy(pfData.serverSeedHash, "serverSeedHash")}
        copyLabel={T.copied}
        emphasis="commitment"
      />

      {/* CLIENT SEED (editavel) */}
      <PFFieldEditable
        label={T.clientSeedLabel}
        value={pfData.clientSeed}
        onChange={onClientSeedChange}
        copied={copiedField === "clientSeed"}
        onCopy={() => onCopy(pfData.clientSeed, "clientSeed")}
        copyLabel={T.copied}
        hint={T.seedHint}
        changedFlash={clientSeedChanged}
        changedMessage={T.seedChanged}
      />

      {/* NONCE */}
      <NonceField label={T.nonceLabel} value={pfData.nonce} />

      {/* SERVER SEED REVEAL (animacao slide quando revelar) */}
      <ServerSeedReveal
        revealed={seedRevealed}
        seed={pfData.serverSeed}
        labelRevealed={T.serverSeedRevealedLabel}
        labelHidden={T.serverSeedHidden}
        copied={copiedField === "serverSeed"}
        onCopy={() => onCopy(pfData.serverSeed, "serverSeed")}
        copyLabel={T.copied}
      />

      {/* VERIFY DETAILS (side-by-side hash) */}
      {verifyDetails && (
        <VerifyDetailsCard details={verifyDetails} T={T} />
      )}

      {/* ACTION BUTTONS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: onRotateSeed ? "1fr 1fr" : "1fr",
          gap: "clamp(8px, 1vw, 14px)",
          marginTop: "clamp(4px, 0.6vw, 8px)",
        }}
      >
        <ActionButton
          onClick={onVerify}
          loading={verifying}
          loadingLabel={T.verifyingBtn}
          label={T.verifyBtn}
          variant="primary"
          icon="check"
        />
        {onRotateSeed && (
          <ActionButton
            onClick={onRotateSeed}
            loading={rotating}
            loadingLabel={T.rotatingBtn}
            label={T.rotateBtn}
            variant="secondary"
            icon="rotate"
          />
        )}
      </div>

      {onRotateSeed && (
        <div
          style={{
            padding: "clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 14px)",
            background: "rgba(212,168,67,0.05)",
            border: `1px dashed ${GOLD.glowSoft}`,
            borderRadius: "6px",
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(10px, 1vw, 12px)",
            color: "rgba(212,168,67,0.7)",
            lineHeight: 1.5,
          }}
        >
          {T.rotateNote}
        </div>
      )}

      {/* HISTORICO DE SEEDS */}
      {seedHistory.length > 0 && (
        <SeedHistorySection records={seedHistory} T={T} onCopy={onCopy} copiedField={copiedField} lang={lang} />
      )}
    </div>
  );
}

// ============================================================
// SUBCOMPONENT: Status Badge Gigante
// ============================================================
function StatusBadge({
  status,
  T,
  unverifiedCount,
}: {
  status: "unverified" | "verified" | "failed";
  T: any;
  unverifiedCount?: number;
}) {
  const config = {
    unverified: { color: GOLD.light, glow: GOLD.glow, bg: "rgba(212,168,67,0.08)", label: T.statusUnverified, icon: "?" },
    verified: { color: EMERALD.light, glow: EMERALD.glow, bg: "rgba(0,230,118,0.1)", label: T.statusVerified, icon: "✓" },
    failed: { color: RED.light, glow: RED.glow, bg: "rgba(255,68,68,0.1)", label: T.statusFailed, icon: "✗" },
  }[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "clamp(12px, 1.5vw, 18px) clamp(16px, 2vw, 24px)",
        background: config.bg,
        border: `1.5px solid ${config.color}`,
        borderRadius: "10px",
        boxShadow: [
          `0 0 0 1px ${config.color}30`,
          `0 0 24px ${config.glow}`,
          "inset 0 1px 1px rgba(255,255,255,0.05)",
        ].join(", "),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px, 1.2vw, 14px)" }}>
        <motion.div
          animate={{ scale: status === "unverified" ? [1, 1.08, 1] : 1 }}
          transition={status === "unverified" ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
          style={{
            width: "clamp(32px, 3.5vw, 44px)",
            height: "clamp(32px, 3.5vw, 44px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(18px, 2vw, 26px)",
            fontWeight: 800,
            color: config.color,
            background: `${config.color}20`,
            border: `2px solid ${config.color}`,
            borderRadius: "50%",
            textShadow: `0 0 14px ${config.glow}`,
          }}
        >
          {config.icon}
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(13px, 1.4vw, 17px)",
              fontWeight: 700,
              letterSpacing: "2px",
              color: config.color,
              textShadow: `0 0 10px ${config.glow}`,
            }}
          >
            {config.label}
          </span>
          {unverifiedCount !== undefined && unverifiedCount > 0 && status === "unverified" && (
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(10px, 1vw, 11px)",
                color: "rgba(212,168,67,0.7)",
              }}
            >
              {unverifiedCount} {T.unverifiedBadge}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// SUBCOMPONENT: PF Field (read-only com copy)
// ============================================================
function PFField({
  label,
  value,
  copied,
  onCopy,
  copyLabel,
  emphasis,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
  emphasis?: "commitment" | "reveal";
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <Label>{label}</Label>
      <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
        <div
          style={{
            flex: 1,
            padding: "clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 14px)",
            background: "rgba(0,0,0,0.55)",
            borderRadius: "6px",
            border: `1px solid ${emphasis === "commitment" ? GOLD.glowSoft : "rgba(212,168,67,0.1)"}`,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(9px, 0.9vw, 11px)",
            color: emphasis === "commitment" ? GOLD.light : "rgba(255,255,255,0.65)",
            wordBreak: "break-all",
            lineHeight: 1.5,
            letterSpacing: "0.3px",
          }}
        >
          {value || "—"}
        </div>
        <CopyButton copied={copied} onClick={onCopy} label={copyLabel} />
      </div>
    </div>
  );
}

// ============================================================
// SUBCOMPONENT: PF Field Editable (input com copy)
// ============================================================
function PFFieldEditable({
  label,
  value,
  onChange,
  copied,
  onCopy,
  copyLabel,
  hint,
  changedFlash,
  changedMessage,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
  hint: string;
  changedFlash: boolean;
  changedMessage: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <Label>{label}</Label>
      <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 64))}
          maxLength={64}
          style={{
            flex: 1,
            padding: "clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 14px)",
            background: "rgba(0,0,0,0.55)",
            borderRadius: "6px",
            border: `1px solid ${changedFlash ? EMERALD.primary : "rgba(212,168,67,0.15)"}`,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(10px, 1vw, 12px)",
            color: GOLD.light,
            outline: "none",
            transition: "border-color 0.3s",
            boxShadow: changedFlash ? `0 0 8px ${EMERALD.glow}` : "none",
          }}
        />
        <CopyButton copied={copied} onClick={onCopy} label={copyLabel} />
      </div>
      <AnimatePresence>
        {changedFlash && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(9px, 0.9vw, 11px)",
              color: EMERALD.light,
              fontWeight: 600,
            }}
          >
            ✓ {changedMessage}
          </motion.div>
        )}
      </AnimatePresence>
      {!changedFlash && (
        <Hint>{hint}</Hint>
      )}
    </div>
  );
}

// ============================================================
// SUBCOMPONENT: Nonce Field (mono grande)
// ============================================================
function NonceField({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <Label>{label}</Label>
      <div
        style={{
          padding: "clamp(8px, 1vw, 12px) clamp(14px, 1.6vw, 20px)",
          background: "rgba(0,0,0,0.55)",
          borderRadius: "6px",
          border: `1px solid ${GOLD.glowSoft}`,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(14px, 1.6vw, 20px)",
          fontWeight: 700,
          color: GOLD.light,
          textAlign: "center",
          letterSpacing: "2px",
          fontVariantNumeric: "tabular-nums" as const,
        }}
      >
        #{value}
      </div>
    </div>
  );
}

// ============================================================
// SUBCOMPONENT: Server Seed Reveal (animacao slide)
// ============================================================
function ServerSeedReveal({
  revealed,
  seed,
  labelRevealed,
  labelHidden,
  copied,
  onCopy,
  copyLabel,
}: {
  revealed: boolean;
  seed: string;
  labelRevealed: string;
  labelHidden: string;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <Label>{revealed ? labelRevealed : ""}</Label>
      <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
        <AnimatePresence mode="wait">
          {revealed ? (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, x: -20, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                flex: 1,
                padding: "clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 14px)",
                background: "linear-gradient(135deg, rgba(0,40,15,0.5) 0%, rgba(0,0,0,0.6) 100%)",
                borderRadius: "6px",
                border: `1px solid ${EMERALD.primary}`,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(9px, 0.9vw, 11px)",
                color: EMERALD.light,
                wordBreak: "break-all",
                lineHeight: 1.5,
                boxShadow: `0 0 16px ${EMERALD.glowSoft}, inset 0 0 12px rgba(0,230,118,0.06)`,
              }}
            >
              {seed}
            </motion.div>
          ) : (
            <motion.div
              key="hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                flex: 1,
                padding: "clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 14px)",
                background: "rgba(0,0,0,0.5)",
                borderRadius: "6px",
                border: `1px dashed ${GOLD.glowSoft}`,
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(10px, 1vw, 12px)",
                color: "rgba(255,255,255,0.4)",
                fontStyle: "italic",
                lineHeight: 1.5,
              }}
            >
              {labelHidden}
            </motion.div>
          )}
        </AnimatePresence>
        {revealed && <CopyButton copied={copied} onClick={onCopy} label={copyLabel} />}
      </div>
    </div>
  );
}

// ============================================================
// SUBCOMPONENT: Verify Details (hash side-by-side)
// ============================================================
function VerifyDetailsCard({
  details,
  T,
}: {
  details: { committedHash: string; recalculatedHash: string; match: boolean };
  T: any;
}) {
  const color = details.match ? EMERALD : RED;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: "clamp(12px, 1.5vw, 18px)",
        background: details.match ? "rgba(0,230,118,0.04)" : "rgba(255,68,68,0.04)",
        border: `1.5px solid ${color.primary}`,
        borderRadius: "10px",
        boxShadow: `0 0 18px ${color.glow}`,
        display: "flex",
        flexDirection: "column",
        gap: "clamp(8px, 1vw, 12px)",
      }}
    >
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(10px, 1vw, 12px)",
          fontWeight: 700,
          color: color.light,
          letterSpacing: "1.8px",
          textShadow: `0 0 8px ${color.glow}`,
        }}
      >
        {T.verifyDetailsTitle}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <HashCompareRow label={T.committedLabel} hash={details.committedHash} />
        <HashCompareRow label={T.recalcLabel} hash={details.recalculatedHash} />
      </div>

      <div
        style={{
          padding: "clamp(8px, 1vw, 10px) clamp(10px, 1.2vw, 14px)",
          background: details.match ? "rgba(0,230,118,0.08)" : "rgba(255,68,68,0.08)",
          borderRadius: "6px",
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(11px, 1.1vw, 13px)",
          color: color.light,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {details.match ? `✓ ${T.matchOK}` : `✗ ${T.matchFAIL}`}
      </div>
    </motion.div>
  );
}

function HashCompareRow({ label, hash }: { label: string; hash: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(9px, 0.85vw, 10px)",
          color: "rgba(212,168,67,0.5)",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <code
        style={{
          padding: "5px 10px",
          background: "rgba(0,0,0,0.6)",
          borderRadius: "4px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(9px, 0.85vw, 10px)",
          color: "rgba(255,255,255,0.7)",
          wordBreak: "break-all",
          lineHeight: 1.5,
          border: `1px solid ${GOLD.glowSoft}`,
        }}
      >
        {hash}
      </code>
    </div>
  );
}

// ============================================================
// SUBCOMPONENT: Action Button (verify / rotate)
// ============================================================
function ActionButton({
  onClick,
  loading,
  label,
  loadingLabel,
  variant,
  icon,
}: {
  onClick?: () => void | Promise<void>;
  loading: boolean;
  label: string;
  loadingLabel: string;
  variant: "primary" | "secondary";
  icon: "check" | "rotate";
}) {
  const config = variant === "primary"
    ? {
        bg: `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 50%, #007530 100%)`,
        color: "#FFFFFF",
        border: EMERALD.primary,
        glow: EMERALD.glow,
      }
    : {
        bg: `linear-gradient(180deg, ${GOLD.light} 0%, ${GOLD.primary} 50%, ${GOLD.dark} 100%)`,
        color: "#1a1300",
        border: GOLD.primary,
        glow: GOLD.glow,
      };

  return (
    <motion.button
      onClick={() => onClick?.()}
      disabled={loading}
      whileHover={!loading ? { scale: 1.02, boxShadow: `0 0 24px ${config.glow}` } : undefined}
      whileTap={!loading ? { scale: 0.97 } : undefined}
      style={{
        padding: "clamp(10px, 1.2vw, 14px) clamp(16px, 2vw, 24px)",
        background: config.bg,
        color: config.color,
        border: `1.5px solid ${config.border}`,
        borderRadius: "8px",
        fontFamily: "'Cinzel', serif",
        fontSize: "clamp(11px, 1.15vw, 13px)",
        fontWeight: 800,
        letterSpacing: "2px",
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.7 : 1,
        minHeight: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: [
          `0 0 14px ${config.glow}`,
          "inset 0 1px 1px rgba(255,255,255,0.2)",
          "0 4px 10px rgba(0,0,0,0.4)",
        ].join(", "),
        transition: "box-shadow 0.2s",
      }}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: "12px",
            height: "12px",
            border: `2px solid ${config.color}`,
            borderTopColor: "transparent",
            borderRadius: "50%",
          }}
        />
      )}
      {!loading && icon === "check" && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {!loading && icon === "rotate" && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="23 4 23 10 17 10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {loading ? loadingLabel : label}
    </motion.button>
  );
}

// ============================================================
// SUBCOMPONENT: Copy Button
// ============================================================
function CopyButton({ copied, onClick, label }: { copied: boolean; onClick: () => void; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        flexShrink: 0,
        padding: "0 clamp(10px, 1.2vw, 14px)",
        background: copied
          ? `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 100%)`
          : "rgba(212,168,67,0.08)",
        border: `1px solid ${copied ? EMERALD.primary : GOLD.glowSoft}`,
        borderRadius: "6px",
        cursor: "pointer",
        color: copied ? "#003B1F" : GOLD.primary,
        fontFamily: "'Cinzel', serif",
        fontSize: "clamp(9px, 0.85vw, 11px)",
        fontWeight: 700,
        letterSpacing: "1px",
        minWidth: copied ? "auto" : "44px",
        minHeight: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        transition: "all 0.2s",
      }}
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {label}
        </>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </motion.button>
  );
}

// ============================================================
// SUBCOMPONENT: Seed History Section
// ============================================================
function SeedHistorySection({
  records,
  T,
  onCopy,
  copiedField,
  lang,
}: {
  records: SeedRecord[];
  T: any;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
  lang: "br" | "in";
}) {
  return (
    <div
      style={{
        marginTop: "clamp(8px, 1vw, 12px)",
        padding: "clamp(12px, 1.5vw, 18px)",
        background: "rgba(15,12,8,0.6)",
        border: `1.5px solid ${GOLD.dark}`,
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "clamp(8px, 1vw, 12px)",
      }}
    >
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(10px, 1vw, 12px)",
          fontWeight: 700,
          color: GOLD.primary,
          letterSpacing: "2px",
        }}
      >
        {T.seedHistoryTitle}
      </div>

      {records.length === 0 ? (
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(11px, 1.1vw, 13px)",
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
            padding: "clamp(12px, 1.5vw, 20px)",
          }}
        >
          {T.seedHistoryEmpty}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "240px", overflowY: "auto" }}>
          {records.map((rec, idx) => (
            <motion.div
              key={`${rec.serverSeed}-${idx}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              style={{
                padding: "clamp(8px, 1vw, 12px)",
                background: "rgba(0,0,0,0.4)",
                border: `1px solid ${GOLD.glowSoft}`,
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "clamp(9px, 0.85vw, 11px)",
                    color: GOLD.primary,
                    fontWeight: 700,
                  }}
                >
                  #{records.length - idx} • nonce {rec.nonce}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "clamp(9px, 0.85vw, 10px)",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {rec.revealedAt}
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "stretch" }}>
                <code
                  style={{
                    flex: 1,
                    padding: "4px 8px",
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: "4px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "clamp(8px, 0.8vw, 10px)",
                    color: EMERALD.light,
                    wordBreak: "break-all",
                  }}
                >
                  {rec.serverSeed.slice(0, 32)}...
                </code>
                <CopyButton
                  copied={copiedField === `history-${idx}`}
                  onClick={() => onCopy(rec.serverSeed, `history-${idx}`)}
                  label={T.copied}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ABA 3: VERIFICAR ANTIGA (calculadora retroativa)
// ============================================================
function VerifyOldTab({ T }: { T: any }) {
  const [hashInput, setHashInput] = useState("");
  const [seedInput, setSeedInput] = useState("");
  const [result, setResult] = useState<"empty" | "match" | "mismatch" | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcHash, setCalcHash] = useState("");

  const handleVerify = async () => {
    if (!hashInput.trim() || !seedInput.trim()) {
      setResult("empty");
      return;
    }
    setCalculating(true);
    setResult(null);
    try {
      const recalc = await sha256Hex(seedInput.trim());
      setCalcHash(recalc);
      setResult(recalc.toLowerCase() === hashInput.trim().toLowerCase() ? "match" : "mismatch");
    } catch {
      setResult("mismatch");
    }
    setCalculating(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.5vw, 18px)" }}>
      {/* INTRO */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "clamp(12px, 1.5vw, 18px)",
          background: "rgba(15,12,8,0.6)",
          border: `1px solid ${GOLD.glowSoft}`,
          borderRadius: "10px",
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(11px, 1.1vw, 13px)",
          color: "rgba(255,255,255,0.72)",
          lineHeight: 1.55,
        }}
      >
        {T.verifyOldIntro}
      </motion.div>

      {/* INPUT 1: HASH */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Label>{T.verifyOldHashLabel}</Label>
        <input
          type="text"
          value={hashInput}
          onChange={(e) => { setHashInput(e.target.value); setResult(null); }}
          placeholder={T.verifyOldHashPlaceholder}
          maxLength={128}
          style={{
            padding: "clamp(10px, 1.2vw, 14px)",
            background: "rgba(0,0,0,0.55)",
            borderRadius: "6px",
            border: `1px solid ${GOLD.glowSoft}`,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(10px, 1vw, 12px)",
            color: GOLD.light,
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = GOLD.primary)}
          onBlur={(e) => (e.currentTarget.style.borderColor = GOLD.glowSoft)}
        />
      </div>

      {/* INPUT 2: SEED */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Label>{T.verifyOldSeedLabel}</Label>
        <input
          type="text"
          value={seedInput}
          onChange={(e) => { setSeedInput(e.target.value); setResult(null); }}
          placeholder={T.verifyOldSeedPlaceholder}
          maxLength={128}
          style={{
            padding: "clamp(10px, 1.2vw, 14px)",
            background: "rgba(0,0,0,0.55)",
            borderRadius: "6px",
            border: `1px solid ${EMERALD.glowSoft}`,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(10px, 1vw, 12px)",
            color: EMERALD.light,
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = EMERALD.primary)}
          onBlur={(e) => (e.currentTarget.style.borderColor = EMERALD.glowSoft)}
        />
      </div>

      {/* BOTAO CALCULAR */}
      <ActionButton
        onClick={handleVerify}
        loading={calculating}
        loadingLabel={T.verifyOldCalculating}
        label={T.verifyOldBtn}
        variant="primary"
        icon="check"
      />

      {/* RESULTADO */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
          >
            {result === "empty" && (
              <ResultBox color={GOLD.light} bg="rgba(212,168,67,0.08)" message={T.verifyOldResultEmpty} />
            )}
            {result === "match" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <ResultBox
                  color={EMERALD.light}
                  bg="rgba(0,230,118,0.08)"
                  message={`✓ ${T.verifyOldResultMatch}`}
                  glow={EMERALD.glow}
                />
                <HashCompareRow label={T.committedLabel} hash={hashInput} />
                <HashCompareRow label={T.recalcLabel} hash={calcHash} />
              </div>
            )}
            {result === "mismatch" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <ResultBox
                  color={RED.light}
                  bg="rgba(255,68,68,0.08)"
                  message={`✗ ${T.verifyOldResultMismatch}`}
                  glow={RED.glow}
                />
                <HashCompareRow label={T.committedLabel} hash={hashInput} />
                <HashCompareRow label={T.recalcLabel} hash={calcHash} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultBox({ color, bg, message, glow }: { color: string; bg: string; message: string; glow?: string }) {
  return (
    <div
      style={{
        padding: "clamp(12px, 1.4vw, 16px) clamp(14px, 1.6vw, 20px)",
        background: bg,
        border: `1.5px solid ${color}`,
        borderRadius: "8px",
        fontFamily: "'Cinzel', serif",
        fontSize: "clamp(12px, 1.2vw, 14px)",
        fontWeight: 700,
        color,
        textAlign: "center",
        letterSpacing: "1.2px",
        boxShadow: glow ? `0 0 18px ${glow}` : "none",
      }}
    >
      {message}
    </div>
  );
}

// ============================================================
// HELPERS DE ESTILO
// ============================================================
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "'Cinzel', serif",
        fontSize: "clamp(9px, 0.95vw, 11px)",
        fontWeight: 700,
        color: "rgba(212,168,67,0.65)",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "clamp(9px, 0.9vw, 11px)",
        color: "rgba(255,255,255,0.35)",
        fontStyle: "italic",
      }}
    >
      {children}
    </span>
  );
}
