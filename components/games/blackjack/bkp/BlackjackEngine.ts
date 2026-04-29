// BlackjackEngine — logica completa do jogo client-side
// Deck 312 cartas (6 decks), Fisher-Yates shuffle, hand value,
// acoes disponiveis, side bets (PP + 21+3), dealer AI (S17),
// resolucao de resultados com payouts
//
// Referencia: docs 5.ROTEIRO P1-P7, 0.PESQUISA P1-P2
// Regras: 6 decks, S17, 3:2 BJ, DAS, Late Surrender
// House edge: 0.46% | RTP: 99.54%

import type { Card, Hand, Rank, Suit, Action, HandResult, ResultType } from "./BlackjackTypes";
import { RULES, SUITS, RANKS } from "./BlackjackConstants";

// ============================================================================
// DECK — 6 decks x 52 = 312 cartas
// ============================================================================

/** Cria shoe de N decks (default 6 = 312 cartas) */
export function createShoe(numDecks: number = RULES.decks): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ rank, suit, faceUp: false });
      }
    }
  }
  return shoe;
}

/** Fisher-Yates shuffle in-place — O(n) uniforme */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Compra uma carta do topo do shoe */
export function drawCard(shoe: Card[], faceUp: boolean = true): { card: Card; remaining: Card[] } {
  const [top, ...remaining] = shoe;
  return {
    card: { ...top, faceUp },
    remaining,
  };
}

// ============================================================================
// HAND VALUE — As = 1 ou 11 automatico
// ============================================================================

/** Calcula valor total da mao, tratando Ases automaticamente */
export function calculateHandValue(cards: Card[]): { total: number; isSoft: boolean } {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    const rank = card.rank;
    if (rank === "A") {
      total += 11;
      aces += 1;
    } else if (rank === "K" || rank === "Q" || rank === "J") {
      total += 10;
    } else {
      total += parseInt(rank, 10);
    }
  }

  // Rebaixar Ases de 11 para 1 enquanto total > 21
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return {
    total,
    isSoft: aces > 0 && total <= 21,
  };
}

/** Verifica se mao eh Blackjack natural (As + 10/J/Q/K nas 2 primeiras) */
export function isBlackjack(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const { total } = calculateHandValue(cards);
  if (total !== 21) return false;
  const hasAce = cards.some((c) => c.rank === "A");
  const hasTen = cards.some((c) => ["10", "J", "Q", "K"].includes(c.rank));
  return hasAce && hasTen;
}

/** Verifica se mao estourou */
export function isBust(cards: Card[]): boolean {
  return calculateHandValue(cards).total > 21;
}

// ============================================================================
// CONSTRUIR HAND A PARTIR DE CARTAS
// ============================================================================

/** Cria um objeto Hand completo a partir de um array de cartas */
export function buildHand(cards: Card[], bet: number, overrides?: Partial<Hand>): Hand {
  const { total, isSoft } = calculateHandValue(cards);
  return {
    cards,
    total,
    isSoft,
    isBust: total > 21,
    isBlackjack: isBlackjack(cards),
    bet,
    isDoubled: false,
    isFromSplit: false,
    isStanding: false,
    isActive: true,
    ...overrides,
  };
}

/** Recalcula total/isSoft/isBust de uma Hand existente */
export function recalcHand(hand: Hand): Hand {
  const { total, isSoft } = calculateHandValue(hand.cards);
  return {
    ...hand,
    total,
    isSoft,
    isBust: total > 21,
    isBlackjack: isBlackjack(hand.cards),
  };
}

// ============================================================================
// ACOES DISPONIVEIS — regras reais
// ============================================================================

/** Verifica quais acoes o jogador pode executar na mao ativa */
export function getAvailableActions(
  hand: Hand,
  balance: number,
  phase: "PLAYER_TURN" | "SPLIT_PLAY",
  handsCount: number,
): Action[] {
  // Mao ja parou ou estourou: sem acoes
  if (hand.isStanding || hand.isBust) return [];

  const actions: Action[] = ["HIT", "STAND"];

  // DOUBLE: so com 2 cartas + saldo suficiente pra dobrar
  if (hand.cards.length === 2 && balance >= hand.bet) {
    actions.push("DOUBLE");
  }

  // SPLIT: 2 cartas de mesmo rank + nao veio de split com max atingido + saldo
  if (
    hand.cards.length === 2 &&
    hand.cards[0].rank === hand.cards[1].rank &&
    handsCount < RULES.maxSplits + 1 &&
    balance >= hand.bet
  ) {
    actions.push("SPLIT");
  }

  // SURRENDER: so na primeira decisao (2 cartas, turno principal, nao split)
  if (
    hand.cards.length === 2 &&
    !hand.isFromSplit &&
    phase === "PLAYER_TURN"
  ) {
    actions.push("SURRENDER");
  }

  return actions;
}

// ============================================================================
// SIDE BETS — Perfect Pairs + 21+3
// ============================================================================

type PPResult = "perfect" | "colored" | "mixed" | null;
type TwentyOneResult = "suited_three" | "straight_flush" | "three_kind" | "straight" | "flush" | null;

/** Avalia Perfect Pairs (primeiras 2 cartas do jogador) */
export function evaluatePerfectPairs(cards: Card[]): { result: PPResult; multiplier: number } {
  if (cards.length < 2) return { result: null, multiplier: 0 };

  const [a, b] = cards;

  // Perfect Pair: mesmo rank + mesmo naipe
  if (a.rank === b.rank && a.suit === b.suit) {
    return { result: "perfect", multiplier: 25 };
  }

  // Colored Pair: mesmo rank + mesma cor (ambos vermelhos ou ambos pretos)
  if (a.rank === b.rank) {
    const redSuits: Suit[] = ["H", "D"];
    const sameColor =
      (redSuits.includes(a.suit) && redSuits.includes(b.suit)) ||
      (!redSuits.includes(a.suit) && !redSuits.includes(b.suit));
    if (sameColor) {
      return { result: "colored", multiplier: 12 };
    }
    // Mixed Pair: mesmo rank, cores diferentes
    return { result: "mixed", multiplier: 6 };
  }

  return { result: null, multiplier: 0 };
}

/** Converte rank para valor numerico sequencial (A=1, 2=2, ..., K=13) */
function rankToSequence(rank: Rank): number {
  const map: Record<Rank, number> = {
    A: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
    "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13,
  };
  return map[rank];
}

/** Verifica se 3 cartas formam sequencia (straight) considerando wrap A-K */
function isStraight(cards: Card[]): boolean {
  const vals = cards.map((c) => rankToSequence(c.rank)).sort((a, b) => a - b);
  // Sequencia normal
  if (vals[2] - vals[1] === 1 && vals[1] - vals[0] === 1) return true;
  // Wrap: Q-K-A
  if (vals[0] === 1 && vals[1] === 12 && vals[2] === 13) return true;
  return false;
}

/** Avalia 21+3 (2 cartas do jogador + 1 carta visivel do dealer) */
export function evaluate21Plus3(
  playerCards: Card[],
  dealerUpCard: Card,
): { result: TwentyOneResult; multiplier: number } {
  if (playerCards.length < 2) return { result: null, multiplier: 0 };

  const three = [playerCards[0], playerCards[1], dealerUpCard];
  const allSameSuit = three[0].suit === three[1].suit && three[1].suit === three[2].suit;
  const allSameRank = three[0].rank === three[1].rank && three[1].rank === three[2].rank;
  const straight = isStraight(three);

  // Suited Three of a Kind (100:1) — mesmo rank + mesmo naipe
  if (allSameRank && allSameSuit) {
    return { result: "suited_three", multiplier: 100 };
  }

  // Straight Flush (40:1) — sequencia + mesmo naipe
  if (straight && allSameSuit) {
    return { result: "straight_flush", multiplier: 40 };
  }

  // Three of a Kind (30:1) — mesmo rank, naipes diferentes
  if (allSameRank) {
    return { result: "three_kind", multiplier: 30 };
  }

  // Straight (10:1) — sequencia, naipes mistos
  if (straight) {
    return { result: "straight", multiplier: 10 };
  }

  // Flush (5:1) — mesmo naipe, sem sequencia
  if (allSameSuit) {
    return { result: "flush", multiplier: 5 };
  }

  return { result: null, multiplier: 0 };
}

// ============================================================================
// DEALER AI — hit ate S17 (stand on soft 17)
// ============================================================================

/** Resolve turno do dealer: revela hole card, hit ate 17+ (S17) */
export function resolveDealer(
  dealerHand: Hand,
  shoe: Card[],
): { finalHand: Hand; remainingShoe: Card[] } {
  // Revelar hole card
  let cards = dealerHand.cards.map((c) => ({ ...c, faceUp: true }));
  let currentShoe = [...shoe];

  // Hit enquanto total < 17 (S17: soft 17 conta como 17, dealer para)
  let { total, isSoft } = calculateHandValue(cards);

  while (total < RULES.dealerStandsOn) {
    const { card, remaining } = drawCard(currentShoe, true);
    cards = [...cards, card];
    currentShoe = remaining;
    const result = calculateHandValue(cards);
    total = result.total;
    isSoft = result.isSoft;
  }

  const finalHand = buildHand(cards, 0, { isStanding: true, isActive: false });
  return { finalHand, remainingShoe: currentShoe };
}

// ============================================================================
// RESOLUCAO DE RESULTADOS — comparar player vs dealer
// ============================================================================

/** Determina resultado de uma mao do jogador contra o dealer */
function resolveHand(playerHand: Hand, dealerHand: Hand, handIndex: number): HandResult {
  const pTotal = playerHand.total;
  const dTotal = dealerHand.total;
  const bet = playerHand.bet;

  // Jogador desistiu (SURRENDER foi tratado antes, mas por seguranca)
  // Surrender eh resolvido inline no handleAction, nao chega aqui

  // Jogador estourou = perde tudo
  if (playerHand.isBust) {
    return { handIndex, type: "BUST", payout: 0, netChange: -bet };
  }

  // Jogador tem Blackjack natural
  if (playerHand.isBlackjack && !playerHand.isFromSplit) {
    // Dealer tambem tem BJ = push
    if (dealerHand.isBlackjack) {
      return { handIndex, type: "PUSH", payout: bet, netChange: 0 };
    }
    // BJ paga 3:2
    const bjPayout = bet + Math.floor(bet * RULES.blackjackPayoutNumerator / RULES.blackjackPayoutDenominator);
    return { handIndex, type: "BLACKJACK", payout: bjPayout, netChange: bjPayout - bet };
  }

  // Dealer estourou = jogador ganha 1:1
  if (dealerHand.isBust) {
    return { handIndex, type: "WIN", payout: bet * 2, netChange: bet };
  }

  // Comparar totais
  if (pTotal > dTotal) {
    return { handIndex, type: "WIN", payout: bet * 2, netChange: bet };
  }
  if (pTotal < dTotal) {
    return { handIndex, type: "LOSE", payout: 0, netChange: -bet };
  }

  // Empate
  return { handIndex, type: "PUSH", payout: bet, netChange: 0 };
}

/** Resolve todas as maos do jogador contra o dealer */
export function determineResults(
  playerHands: Hand[],
  dealerHand: Hand,
): HandResult[] {
  return playerHands.map((hand, idx) => resolveHand(hand, dealerHand, idx));
}

/** Calcula payout total de todos os resultados */
export function totalPayout(results: HandResult[]): number {
  return results.reduce((sum, r) => sum + r.payout, 0);
}

/** Calcula net change total */
export function totalNetChange(results: HandResult[]): number {
  return results.reduce((sum, r) => sum + r.netChange, 0);
}

// ============================================================================
// DEAL INICIAL — distribuir 4 cartas (player 2 + dealer 2)
// ============================================================================

export interface DealResult {
  playerHand: Hand;
  dealerHand: Hand;
  remainingShoe: Card[];
  dealerShowsAce: boolean;
}

/** Distribuir cartas iniciais: player (2 face-up), dealer (1 up + 1 hole) */
export function dealInitial(shoe: Card[], mainBet: number): DealResult {
  let currentShoe = [...shoe];

  // Player carta 1 (face up)
  const p1 = drawCard(currentShoe, true);
  currentShoe = p1.remaining;

  // Dealer carta 1 (face up)
  const d1 = drawCard(currentShoe, true);
  currentShoe = d1.remaining;

  // Player carta 2 (face up)
  const p2 = drawCard(currentShoe, true);
  currentShoe = p2.remaining;

  // Dealer carta 2 (hole card — face DOWN)
  const d2 = drawCard(currentShoe, false);
  currentShoe = d2.remaining;

  const playerHand = buildHand([p1.card, p2.card], mainBet);
  const dealerHand = buildHand([d1.card, d2.card], 0, { isActive: false });
  const dealerShowsAce = d1.card.rank === "A";

  return {
    playerHand,
    dealerHand,
    remainingShoe: currentShoe,
    dealerShowsAce,
  };
}

// ============================================================================
// EXECUTAR ACAO — HIT, STAND, DOUBLE, SPLIT
// ============================================================================

export interface ActionResult {
  updatedHands: Hand[];
  activeHandIndex: number;
  remainingShoe: Card[];
  /** True se todas as maos terminaram (ir pro DEALER_TURN) */
  allHandsDone: boolean;
  /** Custo extra cobrado do saldo (double = bet, split = bet) */
  extraCost: number;
}

/** Executa uma acao na mao ativa */
export function executeAction(
  action: Action,
  hands: Hand[],
  activeIndex: number,
  shoe: Card[],
): ActionResult {
  const hand = hands[activeIndex];
  let currentShoe = [...shoe];
  let updatedHands = [...hands];
  let newActiveIndex = activeIndex;
  let extraCost = 0;

  switch (action) {
    case "HIT": {
      const { card, remaining } = drawCard(currentShoe, true);
      currentShoe = remaining;
      const newCards = [...hand.cards, card];
      const updated = recalcHand({ ...hand, cards: newCards });

      // Se estourou ou atingiu 21, para automaticamente
      if (updated.isBust || updated.total === 21) {
        updatedHands[activeIndex] = { ...updated, isStanding: true, isActive: false };
      } else {
        updatedHands[activeIndex] = updated;
      }
      break;
    }

    case "STAND": {
      updatedHands[activeIndex] = { ...hand, isStanding: true, isActive: false };
      break;
    }

    case "DOUBLE": {
      const { card, remaining } = drawCard(currentShoe, true);
      currentShoe = remaining;
      const newCards = [...hand.cards, card];
      const updated = recalcHand({
        ...hand,
        cards: newCards,
        bet: hand.bet * 2,
        isDoubled: true,
        isStanding: true,
        isActive: false,
      });
      updatedHands[activeIndex] = updated;
      extraCost = hand.bet;
      break;
    }

    case "SPLIT": {
      const [cardA, cardB] = hand.cards;

      // Comprar 1 carta para cada mao nova
      const drawA = drawCard(currentShoe, true);
      currentShoe = drawA.remaining;
      const drawB = drawCard(currentShoe, true);
      currentShoe = drawB.remaining;

      const handA = buildHand([cardA, drawA.card], hand.bet, {
        isFromSplit: true,
        isActive: true,
      });
      const handB = buildHand([cardB, drawB.card], hand.bet, {
        isFromSplit: true,
        isActive: false,
      });

      // Substituir a mao original pelas duas novas
      updatedHands = [
        ...updatedHands.slice(0, activeIndex),
        handA,
        handB,
        ...updatedHands.slice(activeIndex + 1),
      ];
      extraCost = hand.bet;

      // Se mao A tem 21, para automaticamente e passa pra B
      if (handA.total === 21) {
        updatedHands[activeIndex] = { ...updatedHands[activeIndex], isStanding: true, isActive: false };
      }
      break;
    }

    default:
      break;
  }

  // Avancar para proxima mao ativa (se a atual terminou)
  if (updatedHands[newActiveIndex].isStanding || updatedHands[newActiveIndex].isBust) {
    const nextActive = updatedHands.findIndex(
      (h, i) => i > newActiveIndex && !h.isStanding && !h.isBust,
    );
    if (nextActive !== -1) {
      newActiveIndex = nextActive;
      updatedHands[newActiveIndex] = { ...updatedHands[newActiveIndex], isActive: true };
    }
  }

  // Marcar isActive corretamente em todas
  updatedHands = updatedHands.map((h, i) => ({
    ...h,
    isActive: i === newActiveIndex && !h.isStanding && !h.isBust,
  }));

  // Verificar se todas terminaram
  const allDone = updatedHands.every((h) => h.isStanding || h.isBust);

  return {
    updatedHands,
    activeHandIndex: newActiveIndex,
    remainingShoe: currentShoe,
    allHandsDone: allDone,
    extraCost,
  };
}

// ============================================================================
// INSURANCE — resolver seguro
// ============================================================================

/** Resolve pagamento do seguro (dealer tem BJ?) */
export function resolveInsurance(
  dealerHand: Hand,
  insuranceAmount: number,
): { won: boolean; payout: number } {
  if (dealerHand.isBlackjack) {
    const payout = insuranceAmount * (RULES.insurancePayoutNumerator + 1);
    return { won: true, payout };
  }
  return { won: false, payout: 0 };
}
