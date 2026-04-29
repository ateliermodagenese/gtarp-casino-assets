// Blackjack Types — Blackout Casino GTARP
// Tipagem completa para engine + provably fair + 7 telas de UI
// Seguir padrão de SlotsTypes.ts

// ============================================================================
// CARTAS E NAIPES
// ============================================================================

/** Naipes das cartas (hearts, diamonds, spades, clubs) */
export type Suit = "H" | "D" | "S" | "C";

/** Rank da carta (A=Ás, 2-10=numéricas, J=Jack, Q=Queen, K=King) */
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

/** Uma carta no baralho */
export interface Card {
  rank: Rank;
  suit: Suit;
  /** Se true, a carta está virada para cima (visível) */
  faceUp: boolean;
}

// ============================================================================
// MÃOS (HANDS)
// ============================================================================

/** Representa uma mão do jogador ou do dealer */
export interface Hand {
  cards: Card[];
  /** Valor total da mão (considerando Ás como 1 ou 11 automaticamente) */
  total: number;
  /** True se a mão é "soft" (contém Ás valendo 11) */
  isSoft: boolean;
  /** True se a mão estourou (total > 21) */
  isBust: boolean;
  /** True se é Blackjack natural (Ás + carta de 10 nas 2 primeiras) */
  isBlackjack: boolean;
  /** Aposta associada a esta mão */
  bet: number;
  /** True se foi dobrada (DOUBLE DOWN) */
  isDoubled: boolean;
  /** True se veio de split */
  isFromSplit: boolean;
  /** True se jogador parou nesta mão (STAND) */
  isStanding: boolean;
  /** True se esta é a mão ativa no momento (durante split) */
  isActive: boolean;
}

// ============================================================================
// FASES DO JOGO (FSM)
// ============================================================================

/** Fases da máquina de estados do jogo */
export type Phase =
  | "BETTING" // Tela 1: posicionando apostas
  | "DEALING" // Distribuindo cartas iniciais (animação)
  | "INSURANCE" // Tela 3: modal de seguro (dealer mostra Ás)
  | "PLAYER_TURN" // Tela 2: jogador decide HIT/STAND/DOUBLE/SPLIT
  | "SPLIT_PLAY" // Tela 4: jogando múltiplas mãos após split
  | "DEALER_TURN" // Tela 5: dealer revela hole card e joga
  | "RESULT" // Tela 6: mostra resultado da rodada
  | "HISTORY" // Tela 7: modal de histórico
  | "PROVABLY_FAIR"; // Tela 7: modal de provably fair

// ============================================================================
// AÇÕES DO JOGADOR
// ============================================================================

/** Ações disponíveis durante a vez do jogador */
export type Action =
  | "HIT" // Pedir mais uma carta
  | "STAND" // Parar (não pegar mais cartas)
  | "DOUBLE" // Dobrar aposta e pegar exatamente 1 carta
  | "SPLIT" // Dividir par em duas mãos separadas
  | "SURRENDER"; // Desistir e recuperar metade da aposta

// ============================================================================
// SIDE BETS (APOSTAS LATERAIS)
// ============================================================================

/** Tipos de side bets disponíveis */
export type SideBetType = "PP" | "21+3";

/** Estado de uma side bet */
export interface SideBet {
  type: SideBetType;
  amount: number;
  /** Resultado: null = não resolvido, win = ganhou, lose = perdeu */
  result: "win" | "lose" | null;
  /** Payout caso tenha ganhado */
  payout: number;
}

// ============================================================================
// RESULTADO DA RODADA
// ============================================================================

/** Tipo de resultado final de uma mão */
export type ResultType =
  | "WIN" // Jogador ganhou normal (1:1)
  | "BLACKJACK" // Jogador ganhou com BJ natural (3:2)
  | "BUST" // Jogador estourou (>21)
  | "LOSE" // Dealer venceu sem BJ
  | "PUSH" // Empate (aposta devolvida)
  | "SURRENDER"; // Jogador desistiu (recupera metade)

/** Resultado detalhado de uma mão */
export interface HandResult {
  handIndex: number;
  type: ResultType;
  /** Valor pago ao jogador (0 se perdeu, negativo não se aplica aqui) */
  payout: number;
  /** Delta no saldo (payout - bet, para histórico) */
  netChange: number;
}

// ============================================================================
// ESTADO COMPLETO DO JOGO
// ============================================================================

/** Estado global do jogo em qualquer momento */
export interface GameState {
  phase: Phase;

  /** Saldo atual do jogador em G$ */
  balance: number;

  /** Apostas colocadas (principal + side bets) */
  mainBet: number;
  sideBets: {
    PP: SideBet | null;
    "21+3": SideBet | null;
  };

  /** Seguro comprado (null = sem seguro, número = valor pago) */
  insurance: number | null;

  /** Mãos do jogador (1 normalmente, até 4 após splits) */
  playerHands: Hand[];

  /** Índice da mão ativa (quando há splits) */
  activeHandIndex: number;

  /** Mão do dealer */
  dealerHand: Hand;

  /** Resultados após a mão ser completada */
  results: HandResult[];

  /** Identificador único da rodada atual (UUID ou incrementa) */
  roundId: string;
}

// ============================================================================
// HISTÓRICO
// ============================================================================

/** Um registro no histórico de mãos jogadas */
export interface HistoryEntry {
  roundId: string;
  timestamp: number; // Unix timestamp em ms
  playerHands: Hand[];
  dealerHand: Hand;
  mainBet: number;
  sideBets: {
    PP: SideBet | null;
    "21+3": SideBet | null;
  };
  insurance: number | null;
  results: HandResult[];
  totalNetChange: number;
  /** Seed pair para verificação PF */
  serverSeedHashed: string;
  serverSeedRevealed: string | null;
  clientSeed: string;
  nonce: number;
}

// ============================================================================
// PROVABLY FAIR
// ============================================================================

/** Dados de Provably Fair da sessão atual */
export interface PFSession {
  serverSeedHashed: string; // SHA-256 do server seed (público)
  serverSeedRevealed: string | null; // Server seed original (revelado ao trocar sessão)
  clientSeed: string; // Seed do cliente (editável)
  nonce: number; // Contador de rodadas
}

// ============================================================================
// PROPS DE COMPONENTES
// ============================================================================

/** Props do componente raiz BlackjackGame */
export interface BlackjackGameProps {
  onBack: () => void;
  lang: "br" | "en";
  playerId: string | number;
  initialBalance: number;
}

/** Idioma */
export type Lang = "br" | "en";
