"use client";

// PaytableModal — Premium AAA compartilhado para todos os jogos
// F5.B — 30/04/2026
//
// Refatoracao completa (vs V0 282L):
//   1. Grid layout adaptavel (1/2/3 cols dependendo da tela e quantidade)
//   2. Tier system automatico (common/rare/epic/legendary) por intensidade do payout
//   3. Hover preview premium: scale + glow tier + sombra ambiente
//   4. Cards com bordas duplas + boxShadow tier-colored
//   5. Tabela de payouts visual: barra horizontal indicando intensidade
//   6. Multiplier highlights: max payout pulsa golden
//   7. Filtro/sort opcional por categoria
//   8. RTP e regras destacadas em footer luxo
//   9. Empty state premium
//   10. 100% compativel com API V0 (categories, symbols, payouts)

import { useState, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameModal from "./GameModal";

// ============================================================
// TIPOS PUBLICOS (mantidos do V0 — zero breaking changes)
// ============================================================

export interface PaytableSymbol {
  id: string;
  name: string;
  imagePath: string;
  color: string;
  payouts: Record<number | string, number>;
  description?: string;
}

export interface PaytableCategory {
  id: string;
  label: string;
  symbols: PaytableSymbol[];
  payoutLabels?: string[];
  // NOVO opcional: descricao curta da categoria (ex: "Premium symbols")
  description?: string;
}

export interface PaytableModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  lang?: "br" | "in";
  categories: PaytableCategory[];
  footerInfo?: ReactNode;
  escPush?: (id: string, close: () => void) => void;
  escPop?: (id: string) => void;

  // NOVAS props opcionais
  // Layout: "grid" (3 cols), "list" (1 col detalhada), "compact" (cards pequenos)
  layout?: "grid" | "list" | "compact";
  // RTP em destaque (ex: 96.5)
  rtp?: number;
  // Cards extra de info no topo (ex: "Min bet: 1 GC", "Max win: 5000x")
  extraInfo?: { label: string; value: string; color?: string }[];
}

// ============================================================
// PALETA + TIER SYSTEM
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
};

// Tiers por intensidade do payout maximo
function getTierByIntensity(intensity: number): {
  color: string;
  glow: string;
  bg: string;
  label: string;
  borderWidth: number;
} {
  if (intensity >= 0.85) return {
    color: "#AA00FF", glow: "rgba(170,0,255,0.5)",
    bg: "rgba(170,0,255,0.08)", label: "LEGENDARY", borderWidth: 2.5,
  };
  if (intensity >= 0.6) return {
    color: "#FF1744", glow: "rgba(255,23,68,0.45)",
    bg: "rgba(255,23,68,0.06)", label: "EPIC", borderWidth: 2,
  };
  if (intensity >= 0.35) return {
    color: GOLD.light, glow: "rgba(255,215,0,0.4)",
    bg: "rgba(255,215,0,0.06)", label: "RARE", borderWidth: 1.5,
  };
  return {
    color: EMERALD.light, glow: "rgba(0,230,118,0.3)",
    bg: "rgba(0,230,118,0.04)", label: "COMMON", borderWidth: 1.2,
  };
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function PaytableModal({
  open,
  onClose,
  title,
  lang = "br",
  categories,
  footerInfo,
  escPush,
  escPop,
  layout = "grid",
  rtp,
  extraInfo,
}: PaytableModalProps) {
  const T = {
    br: {
      title: "TABELA DE PAGAMENTOS",
      hint: "Passe o mouse sobre cada simbolo para ver detalhes",
      legendCommon: "COMUM",
      legendRare: "RARO",
      legendEpic: "EPICO",
      legendLegendary: "LENDARIO",
      rtpLabel: "RTP",
      empty: "Sem simbolos cadastrados",
    },
    in: {
      title: "PAYTABLE",
      hint: "Hover over each symbol to see details",
      legendCommon: "COMMON",
      legendRare: "RARE",
      legendEpic: "EPIC",
      legendLegendary: "LEGENDARY",
      rtpLabel: "RTP",
      empty: "No symbols registered",
    },
  }[lang];

  const [activeTab, setActiveTab] = useState(categories[0]?.id || "");
  const hasTabs = categories.length > 1;

  const visibleCategories = hasTabs
    ? categories.filter((c) => c.id === activeTab)
    : categories;

  // Calcular max payout global pra normalizar tier system
  const globalMaxPayout = useMemo(() => {
    let max = 0;
    categories.forEach((cat) => {
      cat.symbols.forEach((sym) => {
        Object.values(sym.payouts).forEach((v) => {
          if (v > max) max = v;
        });
      });
    });
    return max || 1;
  }, [categories]);

  return (
    <GameModal
      open={open}
      onClose={onClose}
      title={title || T.title}
      icon="/assets/shared/icons/icon-paytable.png"
      escId="paytable-modal"
      escPush={escPush}
      escPop={escPop}
      width="clamp(380px, 72vw, 920px)"
      tabs={hasTabs ? categories.map((c) => ({ id: c.id, label: c.label })) : undefined}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.5vw, 18px)" }}>
        {/* ============== INFO HEADER (RTP + extras) ============== */}
        {(rtp !== undefined || extraInfo) && (
          <InfoHeader rtp={rtp} extraInfo={extraInfo} rtpLabel={T.rtpLabel} />
        )}

        {/* ============== LEGENDA DE TIERS ============== */}
        <TierLegend T={T} />

        {/* ============== HINT BILINGUE ============== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(10px, 1vw, 12px)",
            color: "rgba(212,168,67,0.5)",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          {T.hint}
        </motion.div>

        {/* ============== CATEGORIAS ============== */}
        <AnimatePresence mode="wait">
          {visibleCategories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <CategorySection
                category={category}
                lang={lang}
                layout={layout}
                globalMaxPayout={globalMaxPayout}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ============== EMPTY STATE ============== */}
        {visibleCategories.length === 0 || (visibleCategories[0]?.symbols.length === 0) ? (
          <EmptyState message={T.empty} />
        ) : null}

        {/* ============== FOOTER INFO ============== */}
        {footerInfo && <FooterInfo>{footerInfo}</FooterInfo>}
      </div>
    </GameModal>
  );
}

// ============================================================
// SUBCOMPONENT: Info Header (RTP em destaque + cards extras)
// ============================================================
function InfoHeader({
  rtp,
  extraInfo,
  rtpLabel,
}: {
  rtp?: number;
  extraInfo?: { label: string; value: string; color?: string }[];
  rtpLabel: string;
}) {
  const items: { label: string; value: string; color: string; emphasis?: boolean }[] = [];
  if (rtp !== undefined) {
    items.push({
      label: rtpLabel,
      value: `${rtp.toFixed(2)}%`,
      color: rtp >= 96 ? EMERALD.light : rtp >= 90 ? GOLD.light : "#FF6B6B",
      emphasis: true,
    });
  }
  if (extraInfo) {
    extraInfo.forEach((info) =>
      items.push({ label: info.label, value: info.value, color: info.color || GOLD.primary })
    );
  }

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)`,
        gap: "clamp(8px, 1vw, 14px)",
        padding: "clamp(12px, 1.5vw, 18px) clamp(14px, 1.8vw, 22px)",
        background: "linear-gradient(135deg, rgba(20,16,10,0.95) 0%, rgba(8,7,6,0.98) 100%)",
        border: `1.5px solid ${GOLD.dark}`,
        borderRadius: "10px",
        boxShadow: [
          `0 0 0 1px ${GOLD.glowSoft}`,
          `0 0 20px ${GOLD.glow}`,
          "inset 0 1px 1px rgba(255,215,0,0.06)",
          "0 6px 14px rgba(0,0,0,0.4)",
        ].join(", "),
      }}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(8px, 0.85vw, 10px)",
              fontWeight: 700,
              color: "rgba(212,168,67,0.6)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            {item.label}
          </span>
          <motion.span
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: item.emphasis ? "clamp(15px, 1.7vw, 22px)" : "clamp(13px, 1.4vw, 18px)",
              fontWeight: 700,
              color: item.color,
              textShadow: item.emphasis ? `0 0 10px ${item.color}80` : "none",
              fontVariantNumeric: "tabular-nums" as const,
              lineHeight: 1.1,
            }}
          >
            {item.value}
          </motion.span>
        </div>
      ))}
    </motion.div>
  );
}

// ============================================================
// SUBCOMPONENT: Tier Legend (legenda de cores)
// ============================================================
function TierLegend({ T }: { T: any }) {
  const tiers = [
    { color: EMERALD.light, glow: "rgba(0,230,118,0.4)", label: T.legendCommon },
    { color: GOLD.light, glow: "rgba(255,215,0,0.4)", label: T.legendRare },
    { color: "#FF1744", glow: "rgba(255,23,68,0.45)", label: T.legendEpic },
    { color: "#AA00FF", glow: "rgba(170,0,255,0.5)", label: T.legendLegendary },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "clamp(8px, 1.2vw, 16px)",
        flexWrap: "wrap",
        padding: "clamp(8px, 1vw, 12px)",
        background: "rgba(15,12,8,0.5)",
        border: `1px solid ${GOLD.glowSoft}`,
        borderRadius: "8px",
      }}
    >
      {tiers.map((tier, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <motion.div
            animate={{ boxShadow: [`0 0 4px ${tier.glow}`, `0 0 10px ${tier.glow}`, `0 0 4px ${tier.glow}`] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: idx * 0.15 }}
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: tier.color,
            }}
          />
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(8px, 0.8vw, 10px)",
              fontWeight: 700,
              color: tier.color,
              letterSpacing: "1.2px",
            }}
          >
            {tier.label}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

// ============================================================
// SUBCOMPONENT: Category Section
// ============================================================
function CategorySection({
  category,
  lang,
  layout,
  globalMaxPayout,
}: {
  category: PaytableCategory;
  lang: "br" | "in";
  layout: "grid" | "list" | "compact";
  globalMaxPayout: number;
}) {
  const payKeys =
    category.payoutLabels ||
    Object.keys(category.symbols[0]?.payouts || {})
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => `${k}+`);

  // Definir colunas do grid baseado no layout
  const gridCols =
    layout === "grid"
      ? "repeat(auto-fill, minmax(240px, 1fr))"
      : layout === "compact"
        ? "repeat(auto-fill, minmax(180px, 1fr))"
        : "1fr"; // list

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1vw, 12px)" }}>
      {/* Titulo + descricao opcional */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          paddingBottom: "8px",
          borderBottom: `1px solid ${GOLD.glowSoft}`,
        }}
      >
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(11px, 1.2vw, 14px)",
            fontWeight: 700,
            color: GOLD.primary,
            letterSpacing: "1.5px",
            textShadow: `0 0 10px ${GOLD.glowSoft}`,
          }}
        >
          {category.label}
        </span>
        {category.description && (
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(10px, 1vw, 12px)",
              color: "rgba(255,255,255,0.45)",
              fontStyle: "italic",
            }}
          >
            {category.description}
          </span>
        )}
      </div>

      {/* Grid/List de simbolos */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: gridCols,
          gap: "clamp(8px, 1vw, 14px)",
        }}
      >
        {category.symbols.map((symbol, idx) => (
          <SymbolCard
            key={symbol.id}
            symbol={symbol}
            payKeys={payKeys}
            index={idx}
            globalMaxPayout={globalMaxPayout}
            layout={layout}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SUBCOMPONENT: Symbol Card (premium com tier system)
// ============================================================
function SymbolCard({
  symbol,
  payKeys,
  index,
  globalMaxPayout,
  layout,
  lang,
}: {
  symbol: PaytableSymbol;
  payKeys: string[];
  index: number;
  globalMaxPayout: number;
  layout: "grid" | "list" | "compact";
  lang: "br" | "in";
}) {
  // Extrair valores
  const payoutValues = payKeys.map((key) => {
    const num = parseInt(key);
    return symbol.payouts[num] ?? symbol.payouts[key] ?? 0;
  });

  const maxPayout = Math.max(...payoutValues.filter((v) => v > 0));
  const intensity = globalMaxPayout > 0 ? maxPayout / globalMaxPayout : 0;
  const tier = getTierByIntensity(intensity);

  // Layout list = horizontal
  if (layout === "list") {
    return (
      <SymbolCardList
        symbol={symbol}
        payKeys={payKeys}
        payoutValues={payoutValues}
        maxPayout={maxPayout}
        index={index}
        tier={tier}
        lang={lang}
      />
    );
  }

  // Layout grid/compact = vertical
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: Math.min(index * 0.04, 0.4),
        type: "spring",
        stiffness: 240,
        damping: 18,
      }}
      whileHover={{
        scale: 1.03,
        boxShadow: [
          `0 0 0 1px ${tier.color}`,
          `0 0 24px ${tier.glow}`,
          `0 8px 20px rgba(0,0,0,0.5)`,
          "inset 0 1px 1px rgba(255,255,255,0.06)",
        ].join(", "),
        y: -2,
        transition: { duration: 0.18 },
      }}
      style={{
        position: "relative",
        padding: "clamp(10px, 1.2vw, 14px)",
        background: `linear-gradient(135deg, ${tier.bg} 0%, rgba(8,7,6,0.95) 100%)`,
        border: `${tier.borderWidth}px solid ${tier.color}40`,
        borderRadius: "10px",
        boxShadow: [
          `0 0 0 1px ${tier.color}25`,
          `0 0 12px ${tier.color}25`,
          "inset 0 1px 1px rgba(255,255,255,0.04)",
          "0 4px 10px rgba(0,0,0,0.35)",
        ].join(", "),
        display: "flex",
        flexDirection: "column",
        gap: "clamp(8px, 1vw, 12px)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
    >
      {/* TIER BADGE no canto superior direito */}
      {intensity >= 0.35 && (
        <span
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            padding: "2px 7px",
            background: `${tier.color}25`,
            border: `1px solid ${tier.color}60`,
            borderRadius: "3px",
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(7px, 0.65vw, 9px)",
            fontWeight: 800,
            color: tier.color,
            letterSpacing: "1.2px",
            textShadow: `0 0 6px ${tier.glow}`,
          }}
        >
          {tier.label}
        </span>
      )}

      {/* IMAGE + NOME */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(8px, 1vw, 12px)",
        }}
      >
        <div
          style={{
            width: "clamp(44px, 5vw, 60px)",
            height: "clamp(44px, 5vw, 60px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            borderRadius: "8px",
            background: `radial-gradient(circle at center, ${symbol.color}20 0%, transparent 70%)`,
            border: `1px solid ${symbol.color}30`,
          }}
        >
          <img
            src={symbol.imagePath}
            alt={symbol.name}
            style={{
              width: "clamp(32px, 3.6vw, 48px)",
              height: "clamp(32px, 3.6vw, 48px)",
              objectFit: "contain",
              filter: `drop-shadow(0 0 8px ${symbol.color}50)`,
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(11px, 1.15vw, 14px)",
              fontWeight: 700,
              color: symbol.color,
              letterSpacing: "0.5px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {symbol.name}
          </span>
          {symbol.description && (
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(9px, 0.85vw, 11px)",
                color: "rgba(255,255,255,0.4)",
                fontStyle: "italic",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {symbol.description}
            </span>
          )}
        </div>
      </div>

      {/* PAYOUT BARS (visual progressivo) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {payKeys.map((key, pIdx) => {
          const val = payoutValues[pIdx];
          if (val === 0) return null;
          const localMax = Math.max(...payoutValues.filter((v) => v > 0));
          const widthPercent = localMax > 0 ? (val / localMax) * 100 : 0;
          const isMax = val === localMax;

          return (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(6px, 0.8vw, 10px)",
              }}
            >
              {/* Quantidade (key) */}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "clamp(9px, 0.85vw, 11px)",
                  color: "rgba(212,168,67,0.55)",
                  width: "clamp(28px, 3vw, 38px)",
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums" as const,
                }}
              >
                {key}
              </span>

              {/* Barra horizontal */}
              <div
                style={{
                  flex: 1,
                  height: "clamp(6px, 0.7vw, 8px)",
                  background: "rgba(0,0,0,0.5)",
                  borderRadius: "3px",
                  overflow: "hidden",
                  border: `1px solid ${tier.color}20`,
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{
                    delay: 0.3 + Math.min(index * 0.04, 0.4) + pIdx * 0.05,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  style={{
                    height: "100%",
                    background: isMax
                      ? `linear-gradient(90deg, ${tier.color}, ${tier.color}cc)`
                      : `linear-gradient(90deg, ${tier.color}80, ${tier.color}60)`,
                    boxShadow: isMax ? `0 0 6px ${tier.glow}` : "none",
                  }}
                />
              </div>

              {/* Valor */}
              <motion.span
                animate={isMax ? { textShadow: [`0 0 6px ${tier.glow}`, `0 0 12px ${tier.glow}`, `0 0 6px ${tier.glow}`] } : {}}
                transition={isMax ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "clamp(11px, 1.1vw, 13px)",
                  fontWeight: 700,
                  color: isMax ? tier.color : "rgba(255,255,255,0.65)",
                  width: "clamp(46px, 5vw, 66px)",
                  textAlign: "right",
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums" as const,
                  letterSpacing: "0.3px",
                }}
              >
                ×{val.toLocaleString(lang === "br" ? "pt-BR" : "en-US")}
              </motion.span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================
// SUBCOMPONENT: Symbol Card LIST (layout horizontal alternativo)
// ============================================================
function SymbolCardList({
  symbol,
  payKeys,
  payoutValues,
  maxPayout,
  index,
  tier,
  lang,
}: {
  symbol: PaytableSymbol;
  payKeys: string[];
  payoutValues: number[];
  maxPayout: number;
  index: number;
  tier: ReturnType<typeof getTierByIntensity>;
  lang: "br" | "in";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4) }}
      whileHover={{
        background: `${tier.color}10`,
        scale: 1.005,
        transition: { duration: 0.15 },
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "clamp(10px, 1.2vw, 16px)",
        padding: "clamp(10px, 1.2vw, 14px)",
        borderRadius: "8px",
        background: index % 2 === 0 ? "rgba(15,12,8,0.5)" : "rgba(15,12,8,0.3)",
        borderLeft: `${tier.borderWidth + 1}px solid ${tier.color}`,
        boxShadow: `0 0 12px ${tier.color}15`,
      }}
    >
      {/* Image */}
      <div
        style={{
          width: "clamp(36px, 4vw, 48px)",
          height: "clamp(36px, 4vw, 48px)",
          flexShrink: 0,
          borderRadius: "8px",
          background: `radial-gradient(circle at center, ${symbol.color}15, transparent 70%)`,
          border: `1px solid ${symbol.color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={symbol.imagePath}
          alt={symbol.name}
          style={{
            width: "clamp(28px, 3vw, 40px)",
            height: "clamp(28px, 3vw, 40px)",
            objectFit: "contain",
            filter: `drop-shadow(0 0 6px ${symbol.color}50)`,
          }}
        />
      </div>

      {/* Nome + descricao */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(11px, 1.15vw, 14px)",
            fontWeight: 700,
            color: symbol.color,
          }}
        >
          {symbol.name}
        </span>
        {symbol.description && (
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(9px, 0.85vw, 11px)",
              color: "rgba(255,255,255,0.4)",
              fontStyle: "italic",
            }}
          >
            {symbol.description}
          </span>
        )}
      </div>

      {/* Payouts inline */}
      <div
        style={{
          display: "flex",
          gap: "clamp(6px, 0.8vw, 10px)",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {payKeys.map((key, pIdx) => {
          const val = payoutValues[pIdx];
          if (val === 0) return null;
          const isMax = val === maxPayout;
          return (
            <div
              key={key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                minWidth: "clamp(40px, 4vw, 52px)",
                padding: "4px 6px",
                borderRadius: "4px",
                background: isMax ? `${tier.color}15` : "transparent",
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "clamp(8px, 0.75vw, 10px)",
                  color: "rgba(212,168,67,0.5)",
                }}
              >
                {key}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "clamp(11px, 1.1vw, 13px)",
                  fontWeight: 700,
                  color: isMax ? tier.color : "rgba(255,255,255,0.65)",
                  textShadow: isMax ? `0 0 8px ${tier.glow}` : "none",
                  fontVariantNumeric: "tabular-nums" as const,
                }}
              >
                ×{val}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================
// SUBCOMPONENT: Empty State
// ============================================================
function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        padding: "clamp(40px, 6vw, 80px) 20px",
        textAlign: "center",
      }}
    >
      <motion.img
        src="/assets/shared/icons/icon-paytable.png"
        alt=""
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: "clamp(48px, 5vw, 72px)",
          height: "clamp(48px, 5vw, 72px)",
          filter: `drop-shadow(0 0 12px ${GOLD.glow})`,
        }}
      />
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(11px, 1.15vw, 14px)",
          color: "rgba(255,255,255,0.35)",
        }}
      >
        {message}
      </span>
    </motion.div>
  );
}

// ============================================================
// SUBCOMPONENT: Footer Info
// ============================================================
function FooterInfo({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      style={{
        marginTop: "clamp(8px, 1vw, 12px)",
        padding: "clamp(10px, 1.2vw, 14px) clamp(14px, 1.6vw, 20px)",
        background: "linear-gradient(135deg, rgba(15,12,8,0.7) 0%, rgba(8,7,6,0.85) 100%)",
        border: `1px solid ${GOLD.glowSoft}`,
        borderRadius: "8px",
        fontFamily: "'Inter', sans-serif",
        fontSize: "clamp(10px, 1vw, 12px)",
        color: "rgba(212,168,67,0.65)",
        lineHeight: 1.6,
      }}
    >
      {children}
    </motion.div>
  );
}
