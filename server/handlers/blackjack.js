// Blackout Casino - Blackjack (#4) - Server Handler
// IIFE: isola escopo pra nao conflitar com bicho/slots (mesmo contexto V8 no FiveM)
(function() {
// Compativel com oxmysql 2.x / CommunityOx (prepared statements)
// Provably Fair: HMAC_SHA256(serverSeed, clientSeed:nonce) → Fisher-Yates shuffle
// 6 decks, S17, 3:2, DAS, Late Surrender

const crypto = require("crypto");
const BJ_RESPONSE = "casino:blackjack:response";
const _bjOn = on;

function dbQuery(sql, params) {
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      console.log(`[CASINO-BJ] TIMEOUT query: ${sql.substring(0, 80)}`);
      resolve(null);
    }, 5000);
    exports.oxmysql.query(sql, params || [], (result) => {
      clearTimeout(t);
      resolve(result);
    });
  });
}

function dbExecute(sql, params) {
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      console.log(`[CASINO-BJ] TIMEOUT execute: ${sql.substring(0, 80)}`);
      resolve(null);
    }, 5000);
    exports.oxmysql.execute(sql, params || [], (result) => {
      clearTimeout(t);
      resolve(result);
    });
  });
}

function safeBjHandler(eventName, handler) {
  RegisterNetEvent(eventName);
  _bjOn(eventName, async (...args) => {
    const src = source;
    const cbId = args[0];
    console.log(`[CASINO-BJ] ${eventName} src=${src} cbId=${cbId}`);
    try {
      await handler(src, cbId, args[1] || {});
    } catch (err) {
      console.log(`[CASINO-BJ] ${eventName} ERRO: ${err.message}`);
      console.log(`[CASINO-BJ] Stack: ${err.stack}`);
      emitNet(BJ_RESPONSE, src, cbId, { error: "server_error", message: err.message });
    }
  });
}

// Mutex por jogador (impede 2 acoes simultaneas)
const playerLocks = {};
function acquireLock(identifier) {
  if (playerLocks[identifier]) return false;
  playerLocks[identifier] = true;
  return true;
}
function releaseLock(identifier) {
  delete playerLocks[identifier];
}

// State em memoria por jogador (maos ativas durante uma rodada)
const activeSessions = {};

// ============================================================================
// PROVABLY FAIR — server-side
// ============================================================================

function generateSeed() {
  return crypto.randomBytes(32).toString("hex");
}

function hashSeed(seed) {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

function hmacBytes(serverSeed, clientSeed, nonce) {
  const hmac = crypto.createHmac("sha256", serverSeed);
  hmac.update(`${clientSeed}:${nonce}`);
  return hmac.digest();
}

function fisherYatesShuffle(deck, serverSeed, clientSeed, nonce) {
  const shuffled = [...deck];
  const bytes = hmacBytes(serverSeed, clientSeed, nonce);
  let cursor = 0;

  for (let i = shuffled.length - 1; i > 0; i--) {
    // Usar 4 bytes por swap para distribuicao uniforme
    if (cursor + 4 > bytes.length) {
      // Gerar mais bytes se necessario (encadear HMAC)
      const extra = crypto.createHmac("sha256", serverSeed);
      extra.update(`${clientSeed}:${nonce}:${cursor}`);
      const moreBytes = extra.digest();
      cursor = 0;
      // Usar moreBytes para este swap
      const val = moreBytes.readUInt32BE(0);
      const j = val % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      continue;
    }
    const val = bytes.readUInt32BE(cursor);
    cursor += 4;
    const j = val % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// ENGINE — server-side (duplica logica critica do client para seguranca)
// ============================================================================

const SUITS = ["H", "D", "S", "C"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function createShoe(numDecks) {
  const shoe = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ rank, suit });
      }
    }
  }
  return shoe;
}

function handValue(cards) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === "A") { total += 11; aces++; }
    else if (["K", "Q", "J"].includes(c.rank)) total += 10;
    else total += parseInt(c.rank, 10);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return { total, isSoft: aces > 0 && total <= 21 };
}

function isBlackjack(cards) {
  if (cards.length !== 2) return false;
  const { total } = handValue(cards);
  if (total !== 21) return false;
  return cards.some(c => c.rank === "A") && cards.some(c => ["10", "J", "Q", "K"].includes(c.rank));
}

function evaluatePP(cards) {
  if (cards.length < 2) return { result: null, multiplier: 0 };
  const [a, b] = cards;
  if (a.rank === b.rank && a.suit === b.suit) return { result: "perfect", multiplier: 25 };
  if (a.rank === b.rank) {
    const reds = ["H", "D"];
    const sameColor = (reds.includes(a.suit) && reds.includes(b.suit)) || (!reds.includes(a.suit) && !reds.includes(b.suit));
    return sameColor ? { result: "colored", multiplier: 12 } : { result: "mixed", multiplier: 6 };
  }
  return { result: null, multiplier: 0 };
}

function rankSeq(rank) {
  const m = { A:1, "2":2, "3":3, "4":4, "5":5, "6":6, "7":7, "8":8, "9":9, "10":10, J:11, Q:12, K:13 };
  return m[rank];
}

function isStraight(cards) {
  const v = cards.map(c => rankSeq(c.rank)).sort((a, b) => a - b);
  if (v[2] - v[1] === 1 && v[1] - v[0] === 1) return true;
  if (v[0] === 1 && v[1] === 12 && v[2] === 13) return true;
  return false;
}

function evaluate21Plus3(playerCards, dealerUpCard) {
  if (playerCards.length < 2) return { result: null, multiplier: 0 };
  const three = [playerCards[0], playerCards[1], dealerUpCard];
  const allSuit = three[0].suit === three[1].suit && three[1].suit === three[2].suit;
  const allRank = three[0].rank === three[1].rank && three[1].rank === three[2].rank;
  const str = isStraight(three);
  if (allRank && allSuit) return { result: "suited_three", multiplier: 100 };
  if (str && allSuit) return { result: "straight_flush", multiplier: 40 };
  if (allRank) return { result: "three_kind", multiplier: 30 };
  if (str) return { result: "straight", multiplier: 10 };
  if (allSuit) return { result: "flush", multiplier: 5 };
  return { result: null, multiplier: 0 };
}

// ============================================================================
// HELPER: obter identifier do jogador
// ============================================================================

async function getIdentifier(src) {
  const ids = getPlayerIdentifiers(src);
  for (const id of ids) {
    if (id.startsWith("license:")) return id;
  }
  return ids[0] || `unknown:${src}`;
}

async function getConfig() {
  const rows = await dbQuery("SELECT * FROM casino_blackjack_config WHERE id = 1");
  return rows && rows[0] ? rows[0] : null;
}

async function getOrCreateSession(identifier) {
  const rows = await dbQuery(
    "SELECT * FROM casino_blackjack_sessions WHERE identifier = ? AND revealed = 0 ORDER BY id DESC LIMIT 1",
    [identifier]
  );
  if (rows && rows[0]) return rows[0];
  const serverSeed = generateSeed();
  const serverSeedHash = hashSeed(serverSeed);
  const clientSeed = crypto.randomBytes(8).toString("hex");
  await dbExecute(
    "INSERT INTO casino_blackjack_sessions (identifier, server_seed, server_seed_hash, client_seed) VALUES (?, ?, ?, ?)",
    [identifier, serverSeed, serverSeedHash, clientSeed]
  );
  return { server_seed: serverSeed, server_seed_hash: serverSeedHash, client_seed: clientSeed, nonce: 0 };
}

async function debitBalance(identifier, amount) {
  const result = await dbExecute(
    "UPDATE casino_accounts SET gcoin_balance = gcoin_balance - ? WHERE identifier = ? AND gcoin_balance >= ?",
    [amount, identifier, amount]
  );
  return result && result.affectedRows > 0;
}

async function creditBalance(identifier, amount) {
  if (amount <= 0) return;
  await dbExecute(
    "UPDATE casino_accounts SET gcoin_balance = gcoin_balance + ? WHERE identifier = ?",
    [amount, identifier]
  );
}

async function getBalance(identifier) {
  const rows = await dbQuery("SELECT gcoin_balance FROM casino_accounts WHERE identifier = ?", [identifier]);
  return rows && rows[0] ? rows[0].gcoin_balance : 0;
}

async function auditLog(identifier, action, details) {
  await dbExecute(
    "INSERT INTO casino_blackjack_audit (identifier, action, details) VALUES (?, ?, ?)",
    [identifier, action, JSON.stringify(details)]
  );
}

// ============================================================================
// ENDPOINT: DEAL — iniciar rodada
// ============================================================================

safeBjHandler("casino:blackjack:deal", async (src, cbId, data) => {
  const identifier = await getIdentifier(src);
  if (!acquireLock(identifier)) {
    return emitNet(BJ_RESPONSE, src, cbId, { error: "locked", message: "Acao em andamento" });
  }

  try {
    const config = await getConfig();
    if (!config || !config.enabled) {
      return emitNet(BJ_RESPONSE, src, cbId, { error: "disabled", message: "Blackjack desabilitado" });
    }

    const mainBet = parseInt(data.main, 10) || 0;
    const ppBet = parseInt(data.pp, 10) || 0;
    const plus21Bet = parseInt(data.plus21, 10) || 0;
    const totalCost = mainBet + ppBet + plus21Bet;

    if (mainBet < config.bet_min || mainBet > config.bet_max) {
      return emitNet(BJ_RESPONSE, src, cbId, { error: "invalid_bet", message: "Aposta fora do limite" });
    }
    if ((ppBet > 0 && (ppBet < config.side_bet_min || ppBet > config.side_bet_max)) ||
        (plus21Bet > 0 && (plus21Bet < config.side_bet_min || plus21Bet > config.side_bet_max))) {
      return emitNet(BJ_RESPONSE, src, cbId, { error: "invalid_side_bet", message: "Side bet fora do limite" });
    }

    if (!await debitBalance(identifier, totalCost)) {
      return emitNet(BJ_RESPONSE, src, cbId, { error: "insufficient_funds", message: "Saldo insuficiente" });
    }

    const session = await getOrCreateSession(identifier);
    const nonce = (session.nonce || 0) + 1;
    await dbExecute(
      "UPDATE casino_blackjack_sessions SET nonce = ? WHERE identifier = ? AND revealed = 0",
      [nonce, identifier]
    );

    const shoe = fisherYatesShuffle(
      createShoe(config.decks),
      session.server_seed,
      session.client_seed,
      nonce
    );

    // Deal: player 2 face-up, dealer 1 up + 1 hole
    const playerCards = [shoe[0], shoe[2]];
    const dealerCards = [shoe[1], shoe[3]];
    const remainingShoe = shoe.slice(4);

    const roundId = crypto.randomUUID();
    const dealerShowsAce = dealerCards[0].rank === "A";

    // Guardar estado em memoria
    activeSessions[identifier] = {
      roundId,
      mainBet,
      ppBet,
      plus21Bet,
      playerHands: [{ cards: playerCards, bet: mainBet, isDoubled: false, isFromSplit: false, isStanding: false }],
      dealerCards,
      shoe: remainingShoe,
      activeHandIndex: 0,
      insurance: null,
      serverSeed: session.server_seed,
      serverSeedHash: session.server_seed_hash,
      clientSeed: session.client_seed,
      nonce,
    };

    await auditLog(identifier, "deal", { roundId, mainBet, ppBet, plus21Bet });

    emitNet(BJ_RESPONSE, src, cbId, {
      roundId,
      playerCards: playerCards.map(c => ({ ...c, faceUp: true })),
      dealerCards: [
        { ...dealerCards[0], faceUp: true },
        { ...dealerCards[1], faceUp: false },
      ],
      dealerShowsAce,
      balance: await getBalance(identifier),
      serverSeedHash: session.server_seed_hash,
      nonce,
    });
  } finally {
    releaseLock(identifier);
  }
});

// ============================================================================
// ENDPOINTS: HIT, STAND, DOUBLE, SPLIT
// ============================================================================

async function handlePlayerAction(src, cbId, identifier, action) {
  const s = activeSessions[identifier];
  if (!s) return emitNet(BJ_RESPONSE, src, cbId, { error: "no_session", message: "Sem sessao ativa" });

  const hand = s.playerHands[s.activeHandIndex];
  if (!hand || hand.isStanding) {
    return emitNet(BJ_RESPONSE, src, cbId, { error: "invalid_action", message: "Mao ja finalizada" });
  }

  let extraCost = 0;

  if (action === "hit") {
    const card = s.shoe.shift();
    hand.cards.push(card);
    const { total } = handValue(hand.cards);
    if (total >= 21) hand.isStanding = true;
  }

  if (action === "stand") {
    hand.isStanding = true;
  }

  if (action === "double") {
    if (hand.cards.length !== 2) {
      return emitNet(BJ_RESPONSE, src, cbId, { error: "invalid_action", message: "Double so com 2 cartas" });
    }
    extraCost = hand.bet;
    if (!await debitBalance(identifier, extraCost)) {
      return emitNet(BJ_RESPONSE, src, cbId, { error: "insufficient_funds" });
    }
    hand.bet *= 2;
    hand.isDoubled = true;
    const card = s.shoe.shift();
    hand.cards.push(card);
    hand.isStanding = true;
  }

  if (action === "split") {
    if (hand.cards.length !== 2 || hand.cards[0].rank !== hand.cards[1].rank) {
      return emitNet(BJ_RESPONSE, src, cbId, { error: "invalid_action", message: "Split requer par" });
    }
    extraCost = hand.bet;
    if (!await debitBalance(identifier, extraCost)) {
      return emitNet(BJ_RESPONSE, src, cbId, { error: "insufficient_funds" });
    }
    const [cardA, cardB] = hand.cards;
    const newCardA = s.shoe.shift();
    const newCardB = s.shoe.shift();
    s.playerHands.splice(s.activeHandIndex, 1,
      { cards: [cardA, newCardA], bet: s.mainBet, isDoubled: false, isFromSplit: true, isStanding: false },
      { cards: [cardB, newCardB], bet: s.mainBet, isDoubled: false, isFromSplit: true, isStanding: false }
    );
  }

  // Avancar para proxima mao se atual terminou
  if (s.playerHands[s.activeHandIndex].isStanding || handValue(s.playerHands[s.activeHandIndex].cards).total > 21) {
    s.playerHands[s.activeHandIndex].isStanding = true;
    let found = false;
    for (let i = s.activeHandIndex + 1; i < s.playerHands.length; i++) {
      if (!s.playerHands[i].isStanding) { s.activeHandIndex = i; found = true; break; }
    }
    if (!found) s.activeHandIndex = -1;
  }

  const allDone = s.playerHands.every(h => h.isStanding || handValue(h.cards).total > 21);

  let response = {
    action,
    playerHands: s.playerHands.map(h => ({
      cards: h.cards.map(c => ({ ...c, faceUp: true })),
      total: handValue(h.cards).total,
      bet: h.bet,
      isDoubled: h.isDoubled,
      isFromSplit: h.isFromSplit,
      isStanding: h.isStanding,
      isBust: handValue(h.cards).total > 21,
    })),
    activeHandIndex: s.activeHandIndex,
    allDone,
    balance: await getBalance(identifier),
  };

  // Se todas as maos terminaram, resolver dealer + resultados
  if (allDone) {
    const dealerResult = resolveDealerServer(s);
    const results = resolveResultsServer(s, dealerResult.cards);

    // Side bets
    let sideBetPayout = 0;
    if (s.ppBet > 0) {
      const pp = evaluatePP(s.playerHands[0].cards);
      if (pp.multiplier > 0) sideBetPayout += s.ppBet * (pp.multiplier + 1);
    }
    if (s.plus21Bet > 0) {
      const t3 = evaluate21Plus3(s.playerHands[0].cards, s.dealerCards[0]);
      if (t3.multiplier > 0) sideBetPayout += s.plus21Bet * (t3.multiplier + 1);
    }

    // Insurance
    let insurancePayout = 0;
    if (s.insurance && isBlackjack(dealerResult.cards)) {
      insurancePayout = s.insurance * 3;
    }

    const totalPayout = results.reduce((sum, r) => sum + r.payout, 0) + sideBetPayout + insurancePayout;
    await creditBalance(identifier, totalPayout);

    // Salvar no DB
    for (const r of results) {
      const h = s.playerHands[r.handIndex];
      const insertResult = await dbExecute(
        `INSERT INTO casino_blackjack_hands
          (identifier, round_id, main_bet, player_cards, dealer_cards, player_total, dealer_total,
           result_type, payout, net_change, is_doubled, is_from_split, hand_index,
           server_seed, server_seed_hash, client_seed, nonce)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          identifier, s.roundId, h.bet, JSON.stringify(h.cards), JSON.stringify(dealerResult.cards),
          handValue(h.cards).total, handValue(dealerResult.cards).total,
          r.type, r.payout, r.netChange, h.isDoubled ? 1 : 0, h.isFromSplit ? 1 : 0, r.handIndex,
          s.serverSeed, s.serverSeedHash, s.clientSeed, s.nonce,
        ]
      );

      // Side bets vinculadas a esta mao
      if (insertResult && insertResult.insertId && r.handIndex === 0) {
        if (s.ppBet > 0) {
          const pp = evaluatePP(h.cards);
          await dbExecute(
            "INSERT INTO casino_blackjack_side_bets (hand_id, identifier, type, amount, result, multiplier, payout) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [insertResult.insertId, identifier, "PP", s.ppBet, pp.result, pp.multiplier, pp.multiplier > 0 ? s.ppBet * (pp.multiplier + 1) : 0]
          );
        }
        if (s.plus21Bet > 0) {
          const t3 = evaluate21Plus3(h.cards, s.dealerCards[0]);
          await dbExecute(
            "INSERT INTO casino_blackjack_side_bets (hand_id, identifier, type, amount, result, multiplier, payout) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [insertResult.insertId, identifier, "21+3", s.plus21Bet, t3.result, t3.multiplier, t3.multiplier > 0 ? s.plus21Bet * (t3.multiplier + 1) : 0]
          );
        }
      }
    }

    await auditLog(identifier, "result", { roundId: s.roundId, results, totalPayout });
    delete activeSessions[identifier];

    response.dealerCards = dealerResult.cards.map(c => ({ ...c, faceUp: true }));
    response.dealerTotal = handValue(dealerResult.cards).total;
    response.results = results;
    response.totalPayout = totalPayout;
    response.balance = await getBalance(identifier);
  }

  emitNet(BJ_RESPONSE, src, cbId, response);
}

function resolveDealerServer(session) {
  let cards = [...session.dealerCards];
  let { total } = handValue(cards);
  while (total < 17) {
    cards.push(session.shoe.shift());
    total = handValue(cards).total;
  }
  return { cards };
}

function resolveResultsServer(session, dealerCards) {
  const dTotal = handValue(dealerCards).total;
  const dBust = dTotal > 21;
  const dBJ = isBlackjack(dealerCards);

  return session.playerHands.map((hand, idx) => {
    const pTotal = handValue(hand.cards).total;
    const pBust = pTotal > 21;
    const pBJ = isBlackjack(hand.cards) && !hand.isFromSplit;
    const bet = hand.bet;

    if (pBust) return { handIndex: idx, type: "BUST", payout: 0, netChange: -bet };
    if (pBJ && dBJ) return { handIndex: idx, type: "PUSH", payout: bet, netChange: 0 };
    if (pBJ) {
      const p = bet + Math.floor(bet * 3 / 2);
      return { handIndex: idx, type: "BLACKJACK", payout: p, netChange: p - bet };
    }
    if (dBust) return { handIndex: idx, type: "WIN", payout: bet * 2, netChange: bet };
    if (pTotal > dTotal) return { handIndex: idx, type: "WIN", payout: bet * 2, netChange: bet };
    if (pTotal < dTotal) return { handIndex: idx, type: "LOSE", payout: 0, netChange: -bet };
    return { handIndex: idx, type: "PUSH", payout: bet, netChange: 0 };
  });
}

safeBjHandler("casino:blackjack:hit", async (src, cbId, data) => {
  const identifier = await getIdentifier(src);
  if (!acquireLock(identifier)) return emitNet(BJ_RESPONSE, src, cbId, { error: "locked" });
  try { await handlePlayerAction(src, cbId, identifier, "hit"); }
  finally { releaseLock(identifier); }
});

safeBjHandler("casino:blackjack:stand", async (src, cbId, data) => {
  const identifier = await getIdentifier(src);
  if (!acquireLock(identifier)) return emitNet(BJ_RESPONSE, src, cbId, { error: "locked" });
  try { await handlePlayerAction(src, cbId, identifier, "stand"); }
  finally { releaseLock(identifier); }
});

safeBjHandler("casino:blackjack:double", async (src, cbId, data) => {
  const identifier = await getIdentifier(src);
  if (!acquireLock(identifier)) return emitNet(BJ_RESPONSE, src, cbId, { error: "locked" });
  try { await handlePlayerAction(src, cbId, identifier, "double"); }
  finally { releaseLock(identifier); }
});

safeBjHandler("casino:blackjack:split", async (src, cbId, data) => {
  const identifier = await getIdentifier(src);
  if (!acquireLock(identifier)) return emitNet(BJ_RESPONSE, src, cbId, { error: "locked" });
  try { await handlePlayerAction(src, cbId, identifier, "split"); }
  finally { releaseLock(identifier); }
});

// ============================================================================
// ENDPOINT: INSURANCE
// ============================================================================

safeBjHandler("casino:blackjack:insurance", async (src, cbId, data) => {
  const identifier = await getIdentifier(src);
  if (!acquireLock(identifier)) return emitNet(BJ_RESPONSE, src, cbId, { error: "locked" });
  try {
    const s = activeSessions[identifier];
    if (!s) return emitNet(BJ_RESPONSE, src, cbId, { error: "no_session" });

    const accept = !!data.accept;
    if (accept) {
      const cost = Math.floor(s.mainBet / 2);
      if (!await debitBalance(identifier, cost)) {
        return emitNet(BJ_RESPONSE, src, cbId, { error: "insufficient_funds" });
      }
      s.insurance = cost;
      await auditLog(identifier, "insurance", { roundId: s.roundId, cost });
    }

    emitNet(BJ_RESPONSE, src, cbId, {
      insurance: s.insurance,
      balance: await getBalance(identifier),
    });
  } finally {
    releaseLock(identifier);
  }
});

// ============================================================================
// ENDPOINT: GET HISTORY
// ============================================================================

safeBjHandler("casino:blackjack:getHistory", async (src, cbId, data) => {
  const identifier = await getIdentifier(src);
  const limit = Math.min(parseInt(data.limit, 10) || 20, 50);
  const rows = await dbQuery(
    `SELECT h.*, GROUP_CONCAT(
        CONCAT(sb.type, ':', sb.amount, ':', IFNULL(sb.result,'null'), ':', sb.payout) SEPARATOR '|'
     ) as side_bets_raw
     FROM casino_blackjack_hands h
     LEFT JOIN casino_blackjack_side_bets sb ON sb.hand_id = h.id
     WHERE h.identifier = ?
     GROUP BY h.id
     ORDER BY h.created_at DESC
     LIMIT ?`,
    [identifier, limit]
  );
  emitNet(BJ_RESPONSE, src, cbId, rows || []);
});

// ============================================================================
// ENDPOINT: VERIFY (PF)
// ============================================================================

safeBjHandler("casino:blackjack:verify", async (src, cbId, data) => {
  const identifier = await getIdentifier(src);
  const rows = await dbQuery(
    "SELECT * FROM casino_blackjack_sessions WHERE identifier = ? AND revealed = 1 ORDER BY id DESC LIMIT 1",
    [identifier]
  );

  if (!rows || !rows[0]) {
    return emitNet(BJ_RESPONSE, src, cbId, { error: "no_revealed_seed", message: "Nenhuma seed revelada. Rotacione primeiro." });
  }

  const session = rows[0];
  const recalculated = hashSeed(session.server_seed);
  const match = recalculated === session.server_seed_hash;

  emitNet(BJ_RESPONSE, src, cbId, {
    serverSeed: session.server_seed,
    serverSeedHash: session.server_seed_hash,
    hashRecalculado: recalculated,
    valido: match,
  });
});

// ============================================================================
// ENDPOINT: ROTATE SEED
// ============================================================================

safeBjHandler("casino:blackjack:rotateSeed", async (src, cbId, data) => {
  const identifier = await getIdentifier(src);

  // Revelar seed atual
  await dbExecute(
    "UPDATE casino_blackjack_sessions SET revealed = 1, revealed_at = NOW() WHERE identifier = ? AND revealed = 0",
    [identifier]
  );

  // Criar nova sessao
  const newSeed = generateSeed();
  const newHash = hashSeed(newSeed);
  const clientSeed = data.clientSeed || crypto.randomBytes(8).toString("hex");

  await dbExecute(
    "INSERT INTO casino_blackjack_sessions (identifier, server_seed, server_seed_hash, client_seed) VALUES (?, ?, ?, ?)",
    [identifier, newSeed, newHash, clientSeed]
  );

  // Pegar seed revelada pra devolver
  const revealed = await dbQuery(
    "SELECT * FROM casino_blackjack_sessions WHERE identifier = ? AND revealed = 1 ORDER BY id DESC LIMIT 1",
    [identifier]
  );

  await auditLog(identifier, "rotate_seed", { newHash });

  emitNet(BJ_RESPONSE, src, cbId, {
    revealedSeed: revealed?.[0]?.server_seed || "",
    revealedHash: revealed?.[0]?.server_seed_hash || "",
    newSeedHash: newHash,
  });
});

// ============================================================================
// ENDPOINT: GET CONFIG
// ============================================================================

safeBjHandler("casino:blackjack:getConfig", async (src, cbId) => {
  const config = await getConfig();
  emitNet(BJ_RESPONSE, src, cbId, config || {});
});

console.log("[CASINO-BJ] Blackjack handler carregado com sucesso");
})();
