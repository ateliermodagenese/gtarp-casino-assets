"use client";

// HistoryModal — Historico premium AAA compartilhado por TODOS os jogos
// F5.A — 30/04/2026
//
// Features novas (vs versao V0 ~260L):
//   1. Stats summary bar no topo (total / winrate / biggest win / sparkline)
//   2. Filtros: tabs TODOS/VITORIAS/DERROTAS + sort por data/ganho/multi
//   3. Sparkline SVG embutido dos ultimos 20 resultados
//   4. Row hover premium (shimmer + scale + sombra)
//   5. Win row glow esmeralda
//   6. Tier system (BIG/MEGA/EPIC/LEGENDARY) com cores
//   7. Empty state premium com PNG
//   8. Skeleton loader enquanto data carrega
//   9. Click row expand inline (PF details: server seed, hash, nonce)
//   10. Export CSV pro clipboard
//
// API mantida 100% compativel com V0 (HistoryColumn<T>, data: T[], etc)
// Adiciona props OPCIONAIS pra novas features (zero breaking changes)

import { type ReactNode, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameModal from "./GameModal";

// ============================================================
// TIPOS PUBLICOS (API)
// ============================================================

// Coluna generica — cada jogo define as suas (mantido do V0)
export interface HistoryColumn<T = any> {
  id: string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  render: (row: T, index: number) => ReactNode;
  headerStyle?: React.CSSProperties;
}

// Stats summary opcional (se passado, mostra a barra de stats)
export interface HistoryStats {
  totalGames?: number;
  totalWagered?: number;
  totalWon?: number;
  biggestWin?: number;
  biggestMultiplier?: number;
  winRate?: number; // 0-1
  // Array de multipliers ou valores pra sparkline (ultimos 20-30)
  sparklineData?: number[];
}

// Filtros opcionais
export type FilterTab = "all" | "wins" | "losses";
export type SortOrder = "recent" | "biggest_win" | "biggest_multi";

export interface HistoryModalProps<T = any> {
  open: boolean;
  onClose: () => void;
  title?: string;
  lang?: "br" | "in";

  // Dados principais
  columns: HistoryColumn<T>[];
  data: T[];

  // Loading state (mostra skeleton)
  loading?: boolean;

  // Stats opcionais — se nao passado, nao mostra a barra
  stats?: HistoryStats;

  // Filtros opcionais — se passado, mostra tabs/sort
  enableFilters?: boolean;
  // Helper pra detectar wins (necessario se enableFilters=true)
  isWin?: (row: T) => boolean;
  // Helpers opcionais para sort
  getValue?: (row: T) => number; // pra sort por ganho
  getMultiplier?: (row: T) => number; // pra sort por multi

  // Empty state customizado
  emptyMessage?: string;
  emptyIcon?: string;

  // Click row pra expandir (mostra detalhes inline)
  renderRowDetail?: (row: T, index: number) => ReactNode;

  // Custom row completo (substitui tabela — Bicho)
  renderCustomRow?: (row: T, index: number) => ReactNode;

  // Conteudo customizado acima da tabela
  headerContent?: ReactNode;

  // Export CSV opcional
  enableExport?: boolean;
  exportFilename?: string;

  // ESC stack
  escPush?: (id: string, close: () => void) => void;
  escPop?: (id: string) => void;
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
  glow: "rgba(255,68,68,0.3)",
};

// ============================================================
// HELPERS DE TIER (multiplier-based)
// ============================================================
function getTier(mult: number): { color: string; glow: string; label: string } {
  if (mult >= 100) return { color: "#AA00FF", glow: "rgba(170,0,255,0.5)", label: "LEGENDARY" };
  if (mult >= 10) return { color: "#FF1744", glow: "rgba(255,23,68,0.5)", label: "EPIC" };
  if (mult >= 5) return { color: "#FF6D00", glow: "rgba(255,109,0,0.5)", label: "MEGA" };
  if (mult >= 2) return { color: GOLD.light, glow: "rgba(255,215,0,0.5)", label: "BIG" };
  return { color: EMERALD.light, glow: EMERALD.glow, label: "WIN" };
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function HistoryModal<T extends { id?: number | string }>({
  open,
  onClose,
  title,
  lang = "br",
  columns,
  data,
  loading = false,
  stats,
  enableFilters = false,
  isWin,
  getValue,
  getMultiplier,
  emptyMessage,
  emptyIcon = "/assets/shared/icons/icon-history.png",
  renderRowDetail,
  renderCustomRow,
  headerContent,
  enableExport = false,
  exportFilename = "history.csv",
  escPush,
  escPop,
}: HistoryModalProps<T>) {
  // Textos bilingues
  const T_TEXT = {
    br: {
      title: "HISTORICO",
      empty: "Nenhum historico ainda. Jogue para ver seus resultados aqui.",
      tabAll: "TODOS",
      tabWins: "VITORIAS",
      tabLosses: "DERROTAS",
      sortRecent: "Mais recente",
      sortBiggestWin: "Maior ganho",
      sortBiggestMulti: "Maior multi",
      statsTotal: "Partidas",
      statsWinRate: "Taxa de vitoria",
      statsBiggestWin: "Maior ganho",
      statsBiggestMulti: "Maior multi",
      export: "Exportar CSV",
      exported: "Copiado!",
      loading: "Carregando...",
    },
    in: {
      title: "HISTORY",
      empty: "No history yet. Play to see your results here.",
      tabAll: "ALL",
      tabWins: "WINS",
      tabLosses: "LOSSES",
      sortRecent: "Most recent",
      sortBiggestWin: "Biggest win",
      sortBiggestMulti: "Biggest multi",
      statsTotal: "Games",
      statsWinRate: "Win rate",
      statsBiggestWin: "Biggest win",
      statsBiggestMulti: "Biggest multi",
      export: "Export CSV",
      exported: "Copied!",
      loading: "Loading...",
    },
  }[lang];

  // ============================================================
  // STATE: Filtros e ordenacao
  // ============================================================
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [expandedRowId, setExpandedRowId] = useState<string | number | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // ============================================================
  // FILTRAR E ORDENAR DADOS
  // ============================================================
  const filteredData = useMemo(() => {
    if (!enableFilters || !isWin) return data;

    let filtered = data;

    // Filtro por tab
    if (activeTab === "wins") filtered = filtered.filter(isWin);
    else if (activeTab === "losses") filtered = filtered.filter((r) => !isWin(r));

    // Sort
    if (sortOrder === "biggest_win" && getValue) {
      filtered = [...filtered].sort((a, b) => getValue(b) - getValue(a));
    } else if (sortOrder === "biggest_multi" && getMultiplier) {
      filtered = [...filtered].sort((a, b) => getMultiplier(b) - getMultiplier(a));
    }
    // 'recent' = ordem original (assume data ja vem ordenada por data desc)

    return filtered;
  }, [data, activeTab, sortOrder, enableFilters, isWin, getValue, getMultiplier]);

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const handleExportCSV = useCallback(() => {
    const headers = columns.map((c) => c.label).join(",");
    const rows = filteredData.map((row, idx) => {
      return columns
        .map((col) => {
          // Tenta extrair valor "limpo" do row (sem React nodes)
          const rendered = col.render(row, idx);
          if (typeof rendered === "string" || typeof rendered === "number") {
            return `"${String(rendered).replace(/"/g, '""')}"`;
          }
          // Fallback: tentar encontrar campo com mesmo id
          const value = (row as any)[col.id];
          if (value !== undefined) return `"${String(value).replace(/"/g, '""')}"`;
          return '""';
        })
        .join(",");
    });
    const csv = [headers, ...rows].join("\n");

    // Copia pro clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(csv).then(() => {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 1500);
      });
    }
  }, [columns, filteredData]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <GameModal
      open={open}
      onClose={onClose}
      title={title || T_TEXT.title}
      icon="/assets/shared/icons/icon-history.png"
      escId="history-modal"
      escPush={escPush}
      escPop={escPop}
      width="clamp(380px, 70vw, 880px)"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.4vw, 18px)" }}>
        {/* ============== STATS SUMMARY BAR (opcional) ============== */}
        {stats && !loading && (
          <StatsSummaryBar stats={stats} lang={lang} />
        )}

        {/* ============== FILTROS (opcional) ============== */}
        {enableFilters && !loading && data.length > 0 && (
          <FiltersBar
            activeTab={activeTab}
            sortOrder={sortOrder}
            onTabChange={setActiveTab}
            onSortChange={setSortOrder}
            T_TEXT={T_TEXT}
            enableSort={!!getValue || !!getMultiplier}
          />
        )}

        {/* ============== HEADER CONTENT CUSTOMIZADO ============== */}
        {headerContent && <div>{headerContent}</div>}

        {/* ============== EXPORT CSV (opcional) ============== */}
        {enableExport && !loading && filteredData.length > 0 && (
          <ExportButton
            onClick={handleExportCSV}
            label={exportSuccess ? T_TEXT.exported : T_TEXT.export}
            success={exportSuccess}
          />
        )}

        {/* ============== LOADING SKELETON ============== */}
        {loading && <SkeletonRows count={5} />}

        {/* ============== EMPTY STATE ============== */}
        {!loading && filteredData.length === 0 && (
          <EmptyState
            icon={emptyIcon}
            message={emptyMessage || T_TEXT.empty}
          />
        )}

        {/* ============== CUSTOM ROW MODE (Bicho etc) ============== */}
        {!loading && filteredData.length > 0 && renderCustomRow && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredData.map((row, idx) => (
              <motion.div
                key={row.id ?? idx}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.5) }}
              >
                {renderCustomRow(row, idx)}
              </motion.div>
            ))}
          </div>
        )}

        {/* ============== TABLE MODE ============== */}
        {!loading && filteredData.length > 0 && !renderCustomRow && (
          <TableView
            columns={columns}
            data={filteredData}
            isWin={isWin}
            getMultiplier={getMultiplier}
            renderRowDetail={renderRowDetail}
            expandedRowId={expandedRowId}
            onRowClick={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          />
        )}
      </div>
    </GameModal>
  );
}

// ============================================================
// SUBCOMPONENT: Stats Summary Bar
// ============================================================
function StatsSummaryBar({ stats, lang }: { stats: HistoryStats; lang: "br" | "in" }) {
  const T_TEXT = {
    br: { games: "Partidas", winRate: "Vitoria", biggestWin: "Maior ganho", biggestMulti: "Maior multi" },
    in: { games: "Games", winRate: "Win rate", biggestWin: "Biggest win", biggestMulti: "Biggest multi" },
  }[lang];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "grid",
        gridTemplateColumns: stats.sparklineData ? "1fr 1fr 1fr 1fr 1.4fr" : "1fr 1fr 1fr 1fr",
        gap: "clamp(8px, 1vw, 14px)",
        padding: "clamp(12px, 1.5vw, 18px) clamp(14px, 1.8vw, 22px)",
        background: "linear-gradient(135deg, rgba(20,16,10,0.95) 0%, rgba(8,7,6,0.98) 100%)",
        border: `1.5px solid ${GOLD.dark}`,
        borderRadius: "10px",
        boxShadow: [
          `0 0 0 1px ${GOLD.glowSoft}`,
          `0 0 24px ${GOLD.glow}`,
          "inset 0 1px 2px rgba(255,215,0,0.08)",
          "0 6px 18px rgba(0,0,0,0.5)",
        ].join(", "),
      }}
    >
      {stats.totalGames !== undefined && (
        <StatCell
          label={T_TEXT.games}
          value={stats.totalGames.toLocaleString(lang === "br" ? "pt-BR" : "en-US")}
          color={GOLD.light}
        />
      )}

      {stats.winRate !== undefined && (
        <StatCell
          label={T_TEXT.winRate}
          value={`${(stats.winRate * 100).toFixed(1)}%`}
          color={stats.winRate >= 0.5 ? EMERALD.light : RED.light}
        />
      )}

      {stats.biggestWin !== undefined && stats.biggestWin > 0 && (
        <StatCell
          label={T_TEXT.biggestWin}
          value={`+${stats.biggestWin.toLocaleString(lang === "br" ? "pt-BR" : "en-US")}`}
          color={EMERALD.light}
          glow
        />
      )}

      {stats.biggestMultiplier !== undefined && stats.biggestMultiplier > 0 && (
        <StatCell
          label={T_TEXT.biggestMulti}
          value={`${stats.biggestMultiplier.toFixed(2)}x`}
          color={getTier(stats.biggestMultiplier).color}
          glow
        />
      )}

      {stats.sparklineData && stats.sparklineData.length > 0 && (
        <Sparkline data={stats.sparklineData} />
      )}
    </motion.div>
  );
}

function StatCell({
  label,
  value,
  color,
  glow = false,
}: {
  label: string;
  value: string;
  color: string;
  glow?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
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
        {label}
      </span>
      <motion.span
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(13px, 1.5vw, 19px)",
          fontWeight: 700,
          color,
          textShadow: glow ? `0 0 10px ${color}99` : "none",
          fontVariantNumeric: "tabular-nums" as const,
          lineHeight: 1.1,
        }}
      >
        {value}
      </motion.span>
    </div>
  );
}

// ============================================================
// SUBCOMPONENT: Sparkline SVG
// ============================================================
function Sparkline({ data }: { data: number[] }) {
  // Normaliza data pra coordenadas SVG
  const width = 120;
  const height = 36;
  const padding = 4;

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Determina cor pelo "trend" (ultima vs primeira)
  const trendUp = data[data.length - 1] > data[0];
  const lineColor = trendUp ? EMERALD.light : RED.light;
  const fillColor = trendUp ? "rgba(0,230,118,0.15)" : "rgba(255,107,107,0.15)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
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
        Trend
      </span>
      <svg width={width} height={height} style={{ display: "block" }}>
        {/* Area fill */}
        <polygon
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          fill={fillColor}
        />
        {/* Linha */}
        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 3px ${lineColor})` }}
        />
        {/* Pontos */}
        {data.map((v, i) => {
          const x = padding + (i / (data.length - 1)) * (width - padding * 2);
          const y = height - padding - ((v - min) / range) * (height - padding * 2);
          const isLast = i === data.length - 1;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={isLast ? 2.5 : 1.2}
              fill={lineColor}
              style={isLast ? { filter: `drop-shadow(0 0 4px ${lineColor})` } : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SUBCOMPONENT: Filters Bar
// ============================================================
function FiltersBar({
  activeTab,
  sortOrder,
  onTabChange,
  onSortChange,
  T_TEXT,
  enableSort,
}: {
  activeTab: FilterTab;
  sortOrder: SortOrder;
  onTabChange: (t: FilterTab) => void;
  onSortChange: (s: SortOrder) => void;
  T_TEXT: any;
  enableSort: boolean;
}) {
  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: T_TEXT.tabAll },
    { id: "wins", label: T_TEXT.tabWins },
    { id: "losses", label: T_TEXT.tabLosses },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "clamp(8px, 1vw, 14px)",
        padding: "clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 14px)",
        background: "rgba(15,12,8,0.6)",
        border: `1px solid ${GOLD.glowSoft}`,
        borderRadius: "8px",
      }}
    >
      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px" }}>
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "clamp(5px, 0.6vw, 8px) clamp(10px, 1.2vw, 16px)",
              background:
                activeTab === tab.id
                  ? `linear-gradient(180deg, ${GOLD.light} 0%, ${GOLD.primary} 100%)`
                  : "rgba(212,168,67,0.06)",
              border: `1px solid ${activeTab === tab.id ? GOLD.primary : GOLD.glowSoft}`,
              borderRadius: "6px",
              cursor: "pointer",
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(9px, 0.95vw, 11px)",
              fontWeight: 700,
              letterSpacing: "1.5px",
              color: activeTab === tab.id ? "#1a1300" : GOLD.primary,
              minHeight: "44px",
              boxShadow:
                activeTab === tab.id ? `0 0 12px ${GOLD.glow}, inset 0 1px 1px rgba(255,215,0,0.3)` : "none",
            }}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Sort dropdown (so se houver helpers) */}
      {enableSort && (
        <select
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value as SortOrder)}
          style={{
            padding: "clamp(5px, 0.6vw, 8px) clamp(10px, 1vw, 12px)",
            background: "rgba(15,12,8,0.9)",
            border: `1px solid ${GOLD.glowSoft}`,
            borderRadius: "6px",
            color: GOLD.primary,
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(10px, 1vw, 12px)",
            cursor: "pointer",
            minHeight: "44px",
            outline: "none",
          }}
        >
          <option value="recent">{T_TEXT.sortRecent}</option>
          <option value="biggest_win">{T_TEXT.sortBiggestWin}</option>
          <option value="biggest_multi">{T_TEXT.sortBiggestMulti}</option>
        </select>
      )}
    </div>
  );
}

// ============================================================
// SUBCOMPONENT: Export Button
// ============================================================
function ExportButton({
  onClick,
  label,
  success,
}: {
  onClick: () => void;
  label: string;
  success: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        alignSelf: "flex-end",
        padding: "clamp(5px, 0.6vw, 8px) clamp(12px, 1.4vw, 18px)",
        background: success
          ? `linear-gradient(180deg, ${EMERALD.light} 0%, ${EMERALD.primary} 100%)`
          : "rgba(212,168,67,0.08)",
        border: `1px solid ${success ? EMERALD.primary : GOLD.glowSoft}`,
        borderRadius: "6px",
        cursor: "pointer",
        fontFamily: "'Cinzel', serif",
        fontSize: "clamp(9px, 0.95vw, 11px)",
        fontWeight: 700,
        letterSpacing: "1.2px",
        color: success ? "#003B1F" : GOLD.primary,
        minHeight: "32px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {success ? (
          <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>
      {label}
    </motion.button>
  );
}

// ============================================================
// SUBCOMPONENT: Skeleton Loader
// ============================================================
function SkeletonRows({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          style={{
            height: "clamp(36px, 4.4vw, 50px)",
            background: "linear-gradient(90deg, rgba(212,168,67,0.04) 0%, rgba(212,168,67,0.08) 50%, rgba(212,168,67,0.04) 100%)",
            backgroundSize: "200% 100%",
            borderRadius: "6px",
            border: `1px solid ${GOLD.glowSoft}`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// SUBCOMPONENT: Empty State
// ============================================================
function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(8px, 1vw, 14px)",
        padding: "clamp(40px, 6vw, 80px) 20px",
        textAlign: "center",
      }}
    >
      <motion.img
        src={icon}
        alt=""
        animate={{ opacity: [0.15, 0.25, 0.15] }}
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
          maxWidth: "300px",
          lineHeight: 1.5,
        }}
      >
        {message}
      </span>
    </motion.div>
  );
}

// ============================================================
// SUBCOMPONENT: Table View (com row glow + expand)
// ============================================================
function TableView<T extends { id?: number | string }>({
  columns,
  data,
  isWin,
  getMultiplier,
  renderRowDetail,
  expandedRowId,
  onRowClick,
}: {
  columns: HistoryColumn<T>[];
  data: T[];
  isWin?: (row: T) => boolean;
  getMultiplier?: (row: T) => number;
  renderRowDetail?: (row: T, index: number) => ReactNode;
  expandedRowId: string | number | null;
  onRowClick: (id: string | number) => void;
}) {
  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          padding: "clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 16px)",
          borderBottom: `1px solid ${GOLD.glowSoft}`,
          marginBottom: "6px",
          position: "sticky",
          top: 0,
          background: "linear-gradient(180deg, #151210 0%, rgba(14,12,9,0.98) 100%)",
          zIndex: 2,
        }}
      >
        {columns.map((col) => (
          <div
            key={col.id}
            style={{
              flex: col.width ? `0 0 ${col.width}` : 1,
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(9px, 0.9vw, 11px)",
              fontWeight: 700,
              color: "rgba(212,168,67,0.5)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              textAlign: col.align || "center",
              ...col.headerStyle,
            }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        {data.map((row, idx) => {
          const won = isWin ? isWin(row) : false;
          const multi = getMultiplier ? getMultiplier(row) : 0;
          const tier = multi >= 5 ? getTier(multi) : null;
          const rowId = row.id ?? idx;
          const isExpanded = expandedRowId === rowId;

          return (
            <motion.div
              key={rowId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(idx * 0.025, 0.5) }}
              style={{ position: "relative" }}
            >
              <motion.div
                whileHover={{
                  background: won ? EMERALD.glowSoft : GOLD.glowSoft,
                  scale: 1.005,
                  transition: { duration: 0.15 },
                }}
                onClick={() => renderRowDetail && onRowClick(rowId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 16px)",
                  background:
                    idx % 2 === 0
                      ? won
                        ? "rgba(0,230,118,0.025)"
                        : "rgba(255,255,255,0.015)"
                      : "transparent",
                  borderRadius: "6px",
                  borderLeft: won
                    ? tier
                      ? `2.5px solid ${tier.color}`
                      : `2.5px solid ${EMERALD.primary}`
                    : "2.5px solid transparent",
                  cursor: renderRowDetail ? "pointer" : "default",
                  transition: "background 0.15s, border-color 0.15s",
                  boxShadow: won && tier ? `0 0 16px ${tier.glow}` : won ? `0 0 8px ${EMERALD.glowSoft}` : "none",
                }}
              >
                {columns.map((col) => (
                  <div
                    key={col.id}
                    style={{
                      flex: col.width ? `0 0 ${col.width}` : 1,
                      textAlign: col.align || "center",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "clamp(11px, 1.1vw, 13px)",
                      color: "rgba(255,255,255,0.78)",
                      fontVariantNumeric: "tabular-nums" as const,
                    }}
                  >
                    {col.render(row, idx)}
                  </div>
                ))}
              </motion.div>

              {/* Detail expanded */}
              <AnimatePresence>
                {isExpanded && renderRowDetail && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      overflow: "hidden",
                      marginTop: "2px",
                      padding: "clamp(10px, 1.2vw, 14px) clamp(14px, 1.6vw, 18px)",
                      background: "rgba(0,0,0,0.4)",
                      border: `1px solid ${GOLD.glowSoft}`,
                      borderRadius: "6px",
                    }}
                  >
                    {renderRowDetail(row, idx)}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// HELPERS PUBLICOS — estilos prontos para colunas (mantidos do V0)
// ============================================================

/** Badge de vitoria/derrota com cor */
export function WinBadge({ won, lang = "br" }: { won: boolean; lang?: "br" | "in" }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "4px",
        fontSize: "clamp(9px, 0.85vw, 11px)",
        fontWeight: 700,
        fontFamily: "'Inter', sans-serif",
        letterSpacing: "1px",
        background: won ? "rgba(0,230,118,0.12)" : "rgba(255,68,68,0.1)",
        color: won ? EMERALD.light : RED.light,
        border: `1px solid ${won ? "rgba(0,230,118,0.3)" : "rgba(255,68,68,0.2)"}`,
        textShadow: won ? `0 0 8px ${EMERALD.glow}` : "none",
      }}
    >
      {won ? (lang === "br" ? "VITORIA" : "WIN") : (lang === "br" ? "DERROTA" : "LOSS")}
    </span>
  );
}

/** Valor com cor verde (ganho) ou vermelho (perda) */
export function WinAmount({ value, prefix = "GC", lang = "br" }: { value: number; prefix?: string; lang?: "br" | "in" }) {
  const won = value > 0;
  const lost = value < 0;
  const formatted = Math.abs(value).toLocaleString(lang === "br" ? "pt-BR" : "en-US");
  return (
    <span
      style={{
        fontWeight: 700,
        color: won ? EMERALD.light : lost ? RED.light : "rgba(255,255,255,0.4)",
        textShadow: won ? `0 0 6px ${EMERALD.glow}` : lost ? `0 0 6px ${RED.glow}` : "none",
      }}
    >
      {won ? `+${formatted}` : lost ? `-${formatted}` : "0"} {prefix}
    </span>
  );
}

/** Multiplicador com tier color (Crash-style) */
export function MultiBadge({ multi }: { multi: number | string }) {
  const numVal = typeof multi === "number" ? multi : parseFloat(String(multi).replace("x", ""));
  if (!numVal || isNaN(numVal)) {
    return <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>;
  }
  const tier = getTier(numVal);
  return (
    <span
      style={{
        fontWeight: 700,
        color: tier.color,
        textShadow: `0 0 8px ${tier.glow}`,
      }}
    >
      {numVal.toFixed(2)}x
    </span>
  );
}

/** Mini badge de tier (BIG/MEGA/EPIC/LEGENDARY) — uso opcional */
export function TierBadge({ multi }: { multi: number }) {
  if (multi < 2) return null; // so mostra de BIG pra cima
  const tier = getTier(multi);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 7px",
        borderRadius: "3px",
        fontSize: "clamp(8px, 0.75vw, 10px)",
        fontWeight: 800,
        fontFamily: "'Cinzel', serif",
        letterSpacing: "1.2px",
        background: `${tier.color}15`,
        color: tier.color,
        border: `1px solid ${tier.color}40`,
        textShadow: `0 0 6px ${tier.glow}`,
      }}
    >
      {tier.label}
    </span>
  );
}
