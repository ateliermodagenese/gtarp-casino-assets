// Blackjack Constants — Blackout Casino GTARP
// Paleta, assets, chips, textos BR/EN, config do jogo
// Seguir padrao de SlotsConstants.ts

import type { Rank, Suit, Lang } from "./BlackjackTypes";

// ============================================================================
// ASSETS — caminhos relativos do projeto (public/ serve na raiz)
// ============================================================================

export const ASSETS = {
  // Background compartilhado
  bgCasino: "/assets/shared/ui/bg-casino.png",

  // Exclusivos do Blackjack
  feltTexture: "/assets/games/blackjack/felt-texture.png",
  cardBack: "/assets/games/blackjack/card-back.png",

  // 6 fichas (nome do arquivo NAO corresponde ao valor)
  chip1: "/assets/games/blackjack/chip-1.png", // G$10
  chip5: "/assets/games/blackjack/chip-5.png", // G$50
  chip25: "/assets/games/blackjack/chip-25.png", // G$250
  chip100: "/assets/games/blackjack/chip-100.png", // G$1000
  chip500: "/assets/games/blackjack/chip-500.png", // G$5000
  chip1000: "/assets/games/blackjack/chip-1000.png", // G$10000

  // Icones de acao exclusivos do Blackjack
  iconHit: "/assets/games/blackjack/icon-hit.png",
  iconStand: "/assets/games/blackjack/icon-stand.png",
  iconDouble: "/assets/games/blackjack/icon-double.png",

  // Icones compartilhados
  iconGcoin: "/assets/shared/icons/icon-gcoin.png",
  iconProvablyFair: "/assets/shared/icons/icon-provably-fair.png",
  iconHistory: "/assets/shared/icons/icon-history.png",
  iconInsurance: "/assets/shared/icons/icon-insurance.png",
  iconNewHand: "/assets/shared/icons/icon-new-hand.png",
  iconCardsSpread: "/assets/shared/icons/icon-cards-spread.png",
  iconChipStack: "/assets/shared/icons/icon-chip-stack.png",
  iconCopy: "/assets/shared/icons/icon-copy.png",
  iconCheck: "/assets/shared/icons/icon-check.png",
  iconClose: "/assets/shared/icons/icon-close.png",
  iconSoundOn: "/assets/shared/icons/icon-sound-on.png",
  iconSoundOff: "/assets/shared/icons/icon-sound-off.png",
  iconInfo: "/assets/shared/icons/icon-info.png",

  // Logos do card do painel
  logoBR: "/assets/logos-br-para-cards/4.LOGO-BR-BLACKJACK.png",
  logoEN: "/assets/logos-in-para-cards/4.LOGO-IN-BLACKJACK.png",
} as const;

// ============================================================================
// PALETA DE CORES
// ============================================================================

export const COLORS = {
  // Fundo
  black: "#0A0A0A",
  panelDark: "#0F0F0F",

  // Ouro (familia principal)
  goldLight: "#FFD700",
  goldPrimary: "#D4A843",
  goldDark: "#8B6914",

  // Felt (mesa)
  feltLight: "#1a472a",
  feltMid: "#0f2d1a",
  feltEdge: "#091a0f",

  // Estados
  greenNeon: "#00E676",
  greenMid: "#00C853",
  greenDark: "#004D25",
  redBust: "#FF1744",
  redSoft: "#FF3B3B",
  blueDouble: "#448AFF",
  blueDeep: "#1A237E",
  purpleSplit: "#B388FF",
  purpleDeep: "#4A148C",

  // Texto
  white: "#FFFFFF",
  textMuted: "#A8A8A8",
  textDim: "#666666",

  // Naipes (tradicional)
  suitRed: "#C62828",
  suitBlack: "#1A1A1A",
} as const;

// ============================================================================
// CHIPS — 6 fichas com valores reais em G$
// ============================================================================

export interface ChipInfo {
  /** Caminho do PNG no public/ */
  path: string;
  /** Valor em G$ que a ficha representa */
  value: number;
  /** Label curto para exibir abaixo da ficha (ex: "1K", "10K") */
  label: string;
}

export const CHIPS: ChipInfo[] = [
  { path: ASSETS.chip1, value: 10, label: "10" },
  { path: ASSETS.chip5, value: 50, label: "50" },
  { path: ASSETS.chip25, value: 250, label: "250" },
  { path: ASSETS.chip100, value: 1000, label: "1K" },
  { path: ASSETS.chip500, value: 5000, label: "5K" },
  { path: ASSETS.chip1000, value: 10000, label: "10K" },
];

// ============================================================================
// REGRAS DO JOGO
// ============================================================================

export const RULES = {
  /** Numero de baralhos (shoe de 6) */
  decks: 6,

  /** Dealer para em 17 ou mais (soft 17 conta como 17) */
  dealerStandsOn: 17,

  /** Pagamento do Blackjack natural (3:2) */
  blackjackPayoutNumerator: 3,
  blackjackPayoutDenominator: 2,

  /** Pagamento do seguro (2:1) */
  insurancePayoutNumerator: 2,
  insurancePayoutDenominator: 1,

  /** Maximo de splits permitidos (resulta em 4 maos no total) */
  maxSplits: 3,

  /** Apostas minima e maxima */
  minBet: 10,
  maxBet: 100000,

  /** Tempo do timer de seguro em segundos */
  insuranceTimerSeconds: 10,

  /** Side bets disponiveis */
  sideBetsEnabled: ["PP", "21+3"] as const,

  /** Minimo e maximo das side bets */
  minSideBet: 10,
  maxSideBet: 10000,
} as const;

// ============================================================================
// CALCULO DO VALOR DA CARTA
// ============================================================================

/**
 * Retorna o valor de uma carta em Blackjack.
 * Para o Ás, retorna 11 por padrão — a logica de soft/hard fica na engine.
 */
export function getCardValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (rank === "J" || rank === "Q" || rank === "K") return 10;
  return parseInt(rank, 10);
}

// ============================================================================
// TEXTOS BR/EN
// ============================================================================

export const TEXTS = {
  // Titulos do jogo
  title: {
    br: "VINTE E UM",
    en: "BLACKJACK",
  },

  // Acoes principais
  deal: { br: "DISTRIBUIR", en: "DEAL" },
  hit: { br: "PEDIR", en: "HIT" },
  stand: { br: "PARAR", en: "STAND" },
  double: { br: "DOBRAR", en: "DOUBLE" },
  split: { br: "DIVIDIR", en: "SPLIT" },
  surrender: { br: "DESISTIR", en: "SURRENDER" },
  newHand: { br: "NOVA MÃO", en: "NEW HAND" },

  // Labels do painel lateral
  yourChips: { br: "SUAS FICHAS", en: "YOUR CHIPS" },
  actions: { br: "AÇÕES", en: "ACTIONS" },
  currentBet: { br: "APOSTA ATUAL", en: "CURRENT BET" },
  activeBet: { br: "APOSTA ATIVA", en: "ACTIVE BET" },
  clear: { br: "LIMPAR", en: "CLEAR" },

  // Labels da mesa
  dealer: { br: "DEALER", en: "DEALER" },
  player: { br: "PLAYER", en: "PLAYER" },
  placeBet: { br: "APOSTE AQUI", en: "PLACE BET" },

  // Seguro
  insuranceTitle: { br: "SEGURO?", en: "INSURANCE?" },
  insuranceBadge: { br: "DEALER MOSTRA ÁS", en: "DEALER SHOWS ACE" },
  insuranceText: {
    br: "O dealer pode ter Blackjack. Pagar metade da aposta para se proteger? O seguro paga 2:1 se o dealer tiver BJ natural.",
    en: "The dealer may have Blackjack. Pay half your bet to protect yourself? Insurance pays 2:1 if the dealer has a natural BJ.",
  },
  insuranceCost: { br: "CUSTO DO SEGURO", en: "INSURANCE COST" },
  yes: { br: "SIM", en: "YES" },
  no: { br: "NÃO", en: "NO" },

  // Resultados
  resultWin: { br: "VOCÊ VENCEU!", en: "YOU WIN!" },
  resultBust: { br: "ESTOUROU!", en: "BUST!" },
  resultBlackjack: { br: "BLACKJACK!", en: "BLACKJACK!" },
  resultPush: { br: "EMPATE", en: "PUSH" },
  resultLose: { br: "DEALER VENCEU", en: "DEALER WINS" },
  resultSurrender: { br: "DESISTÊNCIA", en: "SURRENDER" },

  // Historico
  history: { br: "HISTÓRICO", en: "HISTORY" },
  noHistory: { br: "Nenhuma mão jogada ainda", en: "No hands played yet" },
  historyColumns: {
    br: { round: "Rodada", player: "Jogador", dealer: "Dealer", bet: "Aposta", result: "Resultado", net: "Líquido" },
    en: { round: "Round", player: "Player", dealer: "Dealer", bet: "Bet", result: "Result", net: "Net" },
  },

  // Provably Fair
  provablyFair: { br: "PROVABLY FAIR", en: "PROVABLY FAIR" },
  serverSeedHashed: { br: "Server Seed (hash)", en: "Server Seed (hashed)" },
  serverSeedRevealed: { br: "Server Seed Revelado", en: "Revealed Server Seed" },
  clientSeed: { br: "Client Seed", en: "Client Seed" },
  nonce: { br: "Nonce", en: "Nonce" },
  rotateSeed: { br: "TROCAR SEMENTE", en: "ROTATE SEED" },
  verify: { br: "VERIFICAR", en: "VERIFY" },
  copied: { br: "Copiado!", en: "Copied!" },

  // Tooltips e extras
  back: { br: "VOLTAR", en: "BACK" },
  balance: { br: "Saldo", en: "Balance" },
  payout: { br: "Pagamento", en: "Payout" },
  pp: "PP",
  twentyOnePlusThree: "21+3",

  // Tooltips descritivos (X5)
  tooltips: {
    hit: { br: "Pedir mais uma carta", en: "Draw another card" },
    stand: { br: "Parar e manter as cartas atuais", en: "Keep current cards and end turn" },
    double: { br: "Dobrar a aposta e receber exatamente 1 carta", en: "Double your bet and receive exactly 1 card" },
    split: { br: "Dividir o par em duas mãos separadas", en: "Split your pair into two separate hands" },
    surrender: { br: "Desistir e recuperar metade da aposta", en: "Give up and recover half your bet" },
    deal: { br: "Distribuir as cartas e iniciar a rodada", en: "Deal cards and start the round" },
    clear: { br: "Remover todas as apostas", en: "Remove all bets" },
    pp: { br: "Perfect Pairs — aposte que suas 2 primeiras cartas formam par", en: "Perfect Pairs — bet that your first 2 cards form a pair" },
    twentyOnePlus3: { br: "21+3 — aposte na combinação das suas 2 cartas + carta do dealer", en: "21+3 — bet on the combination of your 2 cards + dealer's card" },
    betArea: { br: "Clique nas fichas para apostar", en: "Click chips to place your bet" },
    newHand: { br: "Jogar nova rodada", en: "Play a new round" },
    soundOn: { br: "Desativar sons", en: "Mute sounds" },
    soundOff: { br: "Ativar sons", en: "Enable sounds" },
  },
} as const;

// ============================================================================
// NAIPES E RANKS — listas iteraveis
// ============================================================================

export const SUITS: Suit[] = ["H", "D", "S", "C"];

export const RANKS: Rank[] = [
  "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K",
];

/** Retorna simbolo Unicode do naipe */
export function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case "H": return "♥";
    case "D": return "♦";
    case "S": return "♠";
    case "C": return "♣";
  }
}

/** Retorna cor do naipe (vermelho ou preto) */
export function getSuitColor(suit: Suit): string {
  return suit === "H" || suit === "D" ? COLORS.suitRed : COLORS.suitBlack;
}

// ============================================================================
// HELPERS DE FORMATACAO
// ============================================================================

/**
 * Formata valor em G$ com separador de milhar pt-BR.
 * Ex: 12450 → "12.450"
 */
export function formatBalance(value: number): string {
  return value >= 1000 ? value.toLocaleString("pt-BR") : String(value);
}

/**
 * Helper para pegar texto BR ou EN de um objeto do TEXTS
 */
export function t(key: { br: string; en: string }, lang: Lang): string {
  return lang === "br" ? key.br : key.en;
}

// ============================================================================
// ACTION BUTTONS — config dos 5 botoes de acao (compartilhado entre telas)
// HIT verde / STAND dourado / DOUBLE azul / SPLIT roxo / SURRENDER vermelho
// ============================================================================

export interface ActionButtonConfig {
  id: "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "SURRENDER";
  gradient: string;
  borderColor: string;
  shadowColor: string;
  iconKey: "iconHit" | "iconStand" | "iconDouble" | null;
  textKey: "hit" | "stand" | "double" | "split" | "surrender";
}

export const ACTION_BUTTONS: ActionButtonConfig[] = [
  {
    id: "HIT",
    gradient:
      "linear-gradient(180deg, #00E676 0%, #00C853 50%, #004D25 100%)",
    borderColor: "rgba(0,230,118,0.5)",
    shadowColor:
      "0 4px 12px rgba(0,200,83,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
    iconKey: "iconHit",
    textKey: "hit",
  },
  {
    id: "STAND",
    gradient:
      "linear-gradient(180deg, #F6E27A 0%, #D4A843 50%, #8B6914 100%)",
    borderColor: "rgba(212,168,67,0.6)",
    shadowColor:
      "0 4px 12px rgba(212,168,67,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
    iconKey: "iconStand",
    textKey: "stand",
  },
  {
    id: "DOUBLE",
    gradient:
      "linear-gradient(180deg, #448AFF 0%, #2962FF 50%, #1A237E 100%)",
    borderColor: "rgba(68,138,255,0.5)",
    shadowColor:
      "0 4px 12px rgba(68,138,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
    iconKey: "iconDouble",
    textKey: "double",
  },
  {
    id: "SPLIT",
    gradient:
      "linear-gradient(180deg, #CE93D8 0%, #B388FF 50%, #4A148C 100%)",
    borderColor: "rgba(179,136,255,0.5)",
    shadowColor:
      "0 4px 12px rgba(179,136,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
    iconKey: null,
    textKey: "split",
  },
  {
    id: "SURRENDER",
    gradient:
      "linear-gradient(180deg, #FF8A80 0%, #FF5252 50%, #B71C1C 100%)",
    borderColor: "rgba(255,82,82,0.5)",
    shadowColor:
      "0 4px 12px rgba(255,82,82,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
    iconKey: null,
    textKey: "surrender",
  },
];
