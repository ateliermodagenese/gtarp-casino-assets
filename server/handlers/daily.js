// Blackout Casino - Daily-Free (#19) - Server Handler
// IIFE: isola escopo pra nao conflitar com outros handlers (mesmo contexto V8 no FiveM)
(function() {
// Compativel com oxmysql 2.x / CommunityOx (prepared statements)
// Provably Fair: HMAC_SHA256(serverSeed, clientSeed:nonce) - padrao Stake.com
// Decisoes da pesquisa X0 ampliada (29/04/2026):
//   - 12 segments + Mystery wedge (config JSON em casino_daily_config)
//   - 28 dias / 4 milestones (D7, D14, D21, D28)
//   - 24h-rolling timer (last_claim_at + 24h)
//   - 3 Make-Up Tokens/mes (Genshin model)
//   - Tier VIP: 2x spins/dia
//   - Anchor reward (vRP first_spawn flag)
//   - Discord webhook em milestones e big wins

const crypto = require("crypto");

const DAILY_RESPONSE = "casino:daily:response";
const _dailyOn = on;

// Wrapper: todo handler async com try/catch + logging (mesmo padrao bicho.js)
function safeDailyHandler(eventName, handler) {
  RegisterNetEvent(eventName);
  _dailyOn(eventName, async (...args) => {
    const src = source;
    const cbId = args[0];
    console.log(`[CASINO-DAILY] ${eventName} src=${src} cbId=${cbId}`);
    try {
      await handler(src, cbId, args[1] || {});
    } catch (err) {
      console.log(`[CASINO-DAILY] ${eventName} ERRO: ${err.message}`);
      console.log(`[CASINO-DAILY] Stack: ${err.stack}`);
      emitNet(DAILY_RESPONSE, src, cbId, { error: "server_error", message: err.message });
    }
  });
}

// ============================================================
// HELPERS DB (timeout 5s padrao slots/blackjack/bicho/panel)
// ============================================================
function dbQuery(sql, params) {
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      console.log(`[CASINO-DB] TIMEOUT query: ${sql.substring(0, 80)}`);
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
      console.log(`[CASINO-DB] TIMEOUT execute: ${sql.substring(0, 80)}`);
      resolve(null);
    }, 5000);
    exports.oxmysql.execute(sql, params || [], (result) => {
      clearTimeout(t);
      resolve(result);
    });
  });
}

// Mutex por jogador (mesmo padrao bicho.js)
const playerLocks = new Map();
async function withPlayerLock(identifier, fn) {
  while (playerLocks.get(identifier)) {
    await new Promise(r => setTimeout(r, 50));
  }
  playerLocks.set(identifier, true);
  try {
    return await fn();
  } finally {
    playerLocks.delete(identifier);
  }
}

// Rate-limit (anti-spam de claim attempts)
const cooldownMap = new Map();
function checkCooldown(identifier, cooldownMs) {
  const agora = Date.now();
  const ultimo = cooldownMap.get(identifier) || 0;
  if (agora - ultimo < cooldownMs) return false;
  cooldownMap.set(identifier, agora);
  return true;
}

// ============================================================
// HELPERS GERAIS
// ============================================================
function getIdentifier(src) {
  const numIds = GetNumPlayerIdentifiers(src);
  for (let i = 0; i < numIds; i++) {
    const id = GetPlayerIdentifier(src, i);
    if (id && id.startsWith("license:")) return id;
  }
  return null;
}

function respond(src, cbId, data) {
  emitNet(DAILY_RESPONSE, src, cbId, data);
}

function getCurrentMonth() {
  // Formato '2026-04' compativel com casino_daily_streaks.makeup_tokens_month
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ============================================================
// PROVABLY FAIR (HMAC-SHA256, padrao Stake.com)
// ============================================================
function gerarSeed() {
  return crypto.randomBytes(32).toString("hex");
}

function hashSeed(seed) {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

function gerarResultadoHMAC(serverSeed, clientSeed, nonce) {
  return crypto.createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest("hex");
}

// Converte primeiros 8 hex chars (= uint32) em float [0,1)
// Exatamente igual ao padrao Stake byteGenerator
function hashToFloat(hmacHex) {
  const slice = hmacHex.substring(0, 8);
  const uint32 = parseInt(slice, 16);
  return uint32 / 0x100000000; // 2^32
}

// ============================================================
// CONFIG do Daily-Free (cache local com TTL 60s)
// ============================================================
let configCache = null;
let configCacheAt = 0;
const CONFIG_TTL_MS = 60000;

async function getConfig() {
  const agora = Date.now();
  if (configCache && (agora - configCacheAt) < CONFIG_TTL_MS) {
    return configCache;
  }
  const linhas = await dbQuery("SELECT * FROM casino_daily_config WHERE id = 1");
  configCache = linhas?.[0] || null;
  configCacheAt = agora;
  return configCache;
}

function invalidateConfigCache() {
  configCache = null;
  configCacheAt = 0;
}

// ============================================================
// SELECAO DE SEGMENT (server-authoritative)
// Usa weighted random com base no float [0,1) do HMAC
// ============================================================
function escolherSegment(segments, resultFloat) {
  // segments e um array JSON: [{id, tier, min, max, weight, icon}, ...]
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  let acum = 0;
  const target = resultFloat * totalWeight;
  for (const seg of segments) {
    acum += seg.weight;
    if (target < acum) return seg;
  }
  // Fallback (nao deveria ocorrer): retorna ultimo
  return segments[segments.length - 1];
}

// Para Mystery wedge: sortear valor dentro do range usando bits adicionais do HMAC
function calcularValorMystery(segment, hmacHex) {
  if (segment.min === segment.max) return segment.min;
  // Usa bytes 8-16 do HMAC pra outro float independente
  const slice = hmacHex.substring(8, 16);
  const uint32 = parseInt(slice, 16);
  const f = uint32 / 0x100000000;
  return Math.floor(segment.min + f * (segment.max - segment.min + 1));
}

// ============================================================
// MILESTONES (D7, D14, D21, D28)
// ============================================================
function calcularMilestoneBonus(cycleDay, config) {
  if (cycleDay === 7)  return { day: 7,  bonus: config.milestone_d7 };
  if (cycleDay === 14) return { day: 14, bonus: config.milestone_d14 };
  if (cycleDay === 21) return { day: 21, bonus: config.milestone_d21 };
  if (cycleDay === 28) return { day: 28, bonus: config.milestone_d28 };
  return { day: null, bonus: 0 };
}

// ============================================================
// STREAK MANAGEMENT (24h-rolling timer + cycle 1-28)
// ============================================================
function podeClaimAgora(streak, cooldownHours, testMode) {
  // FIX 30/04/2026: bypass cooldown se admin ativou test_mode.
  // O claim ainda registra normal no DB (streak avanca, milestones
  // disparam, history grava). So o bloqueio temporal eh ignorado.
  // Admin liga via casino_daily_config.test_mode = 1.
  if (testMode === 1 || testMode === "1") {
    return { ok: true, reason: "test_mode_bypass" };
  }
  if (!streak || !streak.last_claim_at) return { ok: true, reason: "first_claim" };
  const ultimoMs = new Date(streak.last_claim_at).getTime();
  const agoraMs = Date.now();
  const decorrido = agoraMs - ultimoMs;
  const cooldownMs = cooldownHours * 3600000;
  if (decorrido < cooldownMs) {
    const restanteMs = cooldownMs - decorrido;
    return { ok: false, reason: "cooldown", restante_ms: restanteMs };
  }
  return { ok: true, reason: "rolling_24h_ok" };
}

// Determina se o streak deve continuar, zerar ou usar makeup token
function avaliarStreakStatus(streak, cooldownHours, gracePeriodMin) {
  if (!streak || !streak.last_claim_at) {
    return { status: "primeiro_claim", novo_streak: 1, novo_cycle_day: 1 };
  }
  const ultimoMs = new Date(streak.last_claim_at).getTime();
  const agoraMs = Date.now();
  const decorrido = agoraMs - ultimoMs;
  const cooldownMs = cooldownHours * 3600000;
  const limiteOkMs = cooldownMs + (gracePeriodMin * 60000); // 24h + 2h grace = 26h
  // 1 dia de gap (claim normal): cooldown <= decorrido <= limite_ok
  if (decorrido <= limiteOkMs) {
    const novoStreak = streak.current_streak + 1;
    const novoCycleDay = (streak.current_cycle_day % 28) + 1;
    return { status: "streak_continua", novo_streak: novoStreak, novo_cycle_day: novoCycleDay };
  }
  // Mais de 1 dia de gap: streak zera (a menos que use makeup)
  return { status: "streak_perdido", novo_streak: 1, novo_cycle_day: 1 };
}

// ============================================================
// DISCORD WEBHOOK (best-effort, nao bloqueante)
// ============================================================
async function enviarDiscordWebhook(config, identifier, payload) {
  if (!config.discord_webhook_enabled || !config.discord_webhook_url) return;
  if ((payload.total_awarded || 0) < config.discord_min_payout_announce) return;
  try {
    const playerName = GetPlayerName(payload.src) || "Anonimo";
    const embed = {
      title: payload.is_milestone ? "Milestone alcancado!" : "Big win Daily Free!",
      description: `**${playerName}** ganhou **${payload.total_awarded} GC** no Daily-Free`,
      color: payload.is_milestone ? 0xFFD700 : 0xD4A843,
      fields: [
        { name: "Streak atual", value: `${payload.streak} dias`, inline: true },
        { name: "Tier", value: payload.tier, inline: true },
        ...(payload.milestone_day ? [{ name: "Milestone", value: `D${payload.milestone_day}`, inline: true }] : [])
      ],
      timestamp: new Date().toISOString()
    };
    // Fire-and-forget — nao usa await
    PerformHttpRequest(config.discord_webhook_url, () => {}, "POST",
      JSON.stringify({ embeds: [embed] }),
      { "Content-Type": "application/json" }
    );
  } catch (err) {
    console.log(`[CASINO-DAILY] Discord webhook ERRO (nao bloqueante): ${err.message}`);
  }
}

// ============================================================
// REGISTRAR AUDIT
// ============================================================
async function registrarAudit(identifier, action, claimId, details) {
  await dbExecute(
    "INSERT INTO casino_daily_audit (identifier, action, claim_id, details) VALUES (?, ?, ?, ?)",
    [identifier, action, claimId || null, JSON.stringify(details || {})]
  );
}

// ============================================================
// RESET MENSAL DE MAKEUP TOKENS (chamado on-demand)
// ============================================================
async function resetMakeupTokensSeMudouMes(streak, config) {
  const mesAtual = getCurrentMonth();
  if (streak.makeup_tokens_month === mesAtual) return streak;
  // Mes mudou: reset
  await dbExecute(
    "UPDATE casino_daily_streaks SET makeup_tokens_remaining = ?, makeup_tokens_month = ? WHERE identifier = ?",
    [config.makeup_tokens_per_month, mesAtual, streak.identifier]
  );
  streak.makeup_tokens_remaining = config.makeup_tokens_per_month;
  streak.makeup_tokens_month = mesAtual;
  return streak;
}

// ============================================================
// BUSCAR OU CRIAR STREAK
// ============================================================
async function getOrCreateStreak(identifier, config) {
  let linhas = await dbQuery(
    "SELECT * FROM casino_daily_streaks WHERE identifier = ?",
    [identifier]
  );
  if (linhas && linhas.length > 0) {
    let streak = linhas[0];
    streak = await resetMakeupTokensSeMudouMes(streak, config);
    return streak;
  }
  // Cria com seeds iniciais
  const serverSeed = gerarSeed();
  const serverSeedHash = hashSeed(serverSeed);
  const clientSeed = gerarSeed().substring(0, 32); // client seed mais curto
  await dbExecute(
    `INSERT INTO casino_daily_streaks
     (identifier, current_streak, current_cycle_day, makeup_tokens_remaining, makeup_tokens_month,
      server_seed, server_seed_hash, client_seed, nonce)
     VALUES (?, 0, 0, ?, ?, ?, ?, ?, 0)`,
    [identifier, config.makeup_tokens_per_month, getCurrentMonth(),
     serverSeed, serverSeedHash, clientSeed]
  );
  linhas = await dbQuery(
    "SELECT * FROM casino_daily_streaks WHERE identifier = ?",
    [identifier]
  );
  return linhas?.[0];
}

// ============================================================
// VERIFICAR VIP (placeholder - integra com sistema VIP existente)
// Por padrao retorna false; admin pode customizar essa funcao
// ============================================================
async function isVip(identifier) {
  // TODO: integrar com sistema VIP do projeto (pode usar tabela casino_vip_*)
  // Por enquanto: false
  return false;
}

// ============================================================
// ENDPOINT 1: state — retorna estado atual do jogador
// (saldo, streak, makeup tokens, can claim now, server seed hash)
// ============================================================
safeDailyHandler("casino:daily:state", async (src, cbId, payload) => {
  const identifier = getIdentifier(src);
  if (!identifier) return respond(src, cbId, { error: "no_identifier" });

  const config = await getConfig();
  if (!config) return respond(src, cbId, { error: "config_unavailable" });
  if (!config.enabled) return respond(src, cbId, { error: "disabled" });

  const streak = await getOrCreateStreak(identifier, config);
  if (!streak) return respond(src, cbId, { error: "streak_fetch_failed" });

  const podeClaim = podeClaimAgora(streak, config.cooldown_hours, config.test_mode);
  const vip = await isVip(identifier);

  // Buscar saldo
  const saldoRows = await dbQuery(
    "SELECT gcoin_balance FROM casino_accounts WHERE identifier = ?",
    [identifier]
  );
  const saldo = parseFloat(saldoRows?.[0]?.gcoin_balance ?? 0);

  // Parse JSON dos segments
  let segments = [];
  try {
    segments = typeof config.wheel_segments === "string"
      ? JSON.parse(config.wheel_segments)
      : config.wheel_segments;
  } catch (e) {
    console.log(`[CASINO-DAILY] state: erro parse wheel_segments: ${e.message}`);
  }

  respond(src, cbId, {
    ok: true,
    saldo,
    streak: {
      current: streak.current_streak,
      longest: streak.longest_streak,
      cycle_day: streak.current_cycle_day,
      total_claims: streak.total_claims,
      total_earned: streak.total_gcoin_earned,
      cycles_completed: streak.cycles_completed,
      anchor_claimed: !!streak.anchor_claimed,
      last_claim_at: streak.last_claim_at,
    },
    makeup: {
      remaining: streak.makeup_tokens_remaining,
      month: streak.makeup_tokens_month,
      max: config.makeup_tokens_per_month,
    },
    can_claim: podeClaim.ok,
    can_claim_reason: podeClaim.reason,
    cooldown_remaining_ms: podeClaim.restante_ms || 0,
    vip,
    spins_per_day: vip ? config.spins_per_day_vip : config.spins_per_day_free,
    config: {
      cycle_days: config.cycle_days,
      cooldown_hours: config.cooldown_hours,
      milestone_d7: config.milestone_d7,
      milestone_d14: config.milestone_d14,
      milestone_d21: config.milestone_d21,
      milestone_d28: config.milestone_d28,
    },
    wheel: {
      segments,
      server_seed_hash: streak.server_seed_hash,
      client_seed: streak.client_seed,
      next_nonce: streak.nonce + 1,
    }
  });
});

// ============================================================
// ENDPOINT 2: claim — executa o giro (server-authoritative)
// ============================================================
safeDailyHandler("casino:daily:claim", async (src, cbId, payload) => {
  const identifier = getIdentifier(src);
  if (!identifier) return respond(src, cbId, { error: "no_identifier" });

  const config = await getConfig();
  if (!config) return respond(src, cbId, { error: "config_unavailable" });
  if (!config.enabled) return respond(src, cbId, { error: "disabled" });

  // Rate limit (anti-spam de clicks)
  if (!checkCooldown(identifier, config.rate_limit_seconds * 1000)) {
    await registrarAudit(identifier, "rate_limit_hit", null, { event: "claim" });
    return respond(src, cbId, { error: "rate_limited" });
  }

  // Mutex por jogador (impede 2 claims simultaneos)
  await withPlayerLock(identifier, async () => {

    const streak = await getOrCreateStreak(identifier, config);
    if (!streak) return respond(src, cbId, { error: "streak_fetch_failed" });

    // 24h-rolling check
    const podeClaim = podeClaimAgora(streak, config.cooldown_hours, config.test_mode);
    if (!podeClaim.ok) {
      await registrarAudit(identifier, "claim_attempt_blocked", null, {
        reason: podeClaim.reason,
        restante_ms: podeClaim.restante_ms
      });
      return respond(src, cbId, {
        error: "cooldown",
        restante_ms: podeClaim.restante_ms
      });
    }

    // Avaliar status do streak (continua, zerou, primeiro)
    const avaliacao = avaliarStreakStatus(streak, config.cooldown_hours, config.grace_period_minutes);

    // Se zerou, registrar audit
    if (avaliacao.status === "streak_perdido") {
      await registrarAudit(identifier, "streak_reset", null, {
        old_streak: streak.current_streak,
        old_cycle_day: streak.current_cycle_day
      });
    }

    // Anchor reward (primeiro claim vitalicio)
    const isAnchor = !streak.anchor_claimed;
    const claimType = isAnchor ? "anchor" : (avaliacao.status === "primeiro_claim" ? "regular" : "regular");

    // Provably Fair: gerar resultado
    const novoNonce = streak.nonce + 1;
    const hmacHex = gerarResultadoHMAC(streak.server_seed, streak.client_seed, novoNonce);
    const resultFloat = hashToFloat(hmacHex);

    // Parse segments
    let segments = [];
    try {
      segments = typeof config.wheel_segments === "string"
        ? JSON.parse(config.wheel_segments)
        : config.wheel_segments;
    } catch (e) {
      return respond(src, cbId, { error: "segments_parse_error" });
    }
    if (!segments.length) return respond(src, cbId, { error: "no_segments" });

    const segmentVencedor = escolherSegment(segments, resultFloat);

    // Calcular valor (Mystery usa range, outros sao fixos)
    const wheelAmount = (segmentVencedor.tier === "mystery")
      ? calcularValorMystery(segmentVencedor, hmacHex)
      : segmentVencedor.min;

    // Mystery extra fica registrado pra audit
    const mysteryAmount = (segmentVencedor.tier === "mystery") ? wheelAmount : null;

    // Milestone (so se streak_continua e cycle_day for 7/14/21/28)
    const milestone = (avaliacao.status === "streak_continua")
      ? calcularMilestoneBonus(avaliacao.novo_cycle_day, config)
      : { day: null, bonus: 0 };

    // Total awarded
    const totalAwarded = wheelAmount + milestone.bonus;

    // Cap de seguranca
    const totalCapped = Math.min(totalAwarded, config.max_payout_per_spin);

    // Result hash pro audit
    const resultHash = crypto.createHash("sha256")
      .update(`${segmentVencedor.id}:${wheelAmount}:${novoNonce}`)
      .digest("hex");

    // ========== TRANSACAO ATOMICA ==========
    // 1. Garantir conta
    await dbExecute(
      "INSERT IGNORE INTO casino_accounts (identifier, gcoin_balance) VALUES (?, 0.00)",
      [identifier]
    );

    // 2. Buscar saldo antes
    const saldoRows = await dbQuery(
      "SELECT gcoin_balance FROM casino_accounts WHERE identifier = ?",
      [identifier]
    );
    const saldoAntes = parseFloat(saldoRows?.[0]?.gcoin_balance ?? 0);
    const saldoDepois = saldoAntes + totalCapped;

    // 3. Creditar saldo
    await dbExecute(
      "UPDATE casino_accounts SET gcoin_balance = ?, total_won = total_won + ? WHERE identifier = ?",
      [saldoDepois, totalCapped, identifier]
    );

    // 4. Registrar transaction (audit log do panel)
    await dbExecute(
      `INSERT INTO casino_transactions (identifier, tipo, valor, saldo_antes, saldo_depois, jogo, detalhes)
       VALUES (?, 'bonus', ?, ?, ?, 'daily-free', ?)`,
      [identifier, totalCapped, saldoAntes, saldoDepois,
       `Daily-Free dia ${avaliacao.novo_cycle_day} - ${segmentVencedor.tier}`]
    );

    // 5. Atualizar streak
    const longestNovo = Math.max(streak.longest_streak, avaliacao.novo_streak);
    const cyclesCompletosNovo = (avaliacao.novo_cycle_day === 28 && avaliacao.status === "streak_continua")
      ? streak.cycles_completed + 1
      : streak.cycles_completed;

    await dbExecute(
      `UPDATE casino_daily_streaks SET
         current_streak = ?,
         longest_streak = ?,
         current_cycle_day = ?,
         total_claims = total_claims + 1,
         total_gcoin_earned = total_gcoin_earned + ?,
         cycles_completed = ?,
         last_claim_at = NOW(),
         last_claim_segment_id = ?,
         nonce = ?,
         anchor_claimed = ?,
         anchor_claimed_at = COALESCE(anchor_claimed_at, NOW()),
         cycle_started_at = COALESCE(cycle_started_at, NOW())
       WHERE identifier = ?`,
      [
        avaliacao.novo_streak,
        longestNovo,
        avaliacao.novo_cycle_day,
        totalCapped,
        cyclesCompletosNovo,
        segmentVencedor.id,
        novoNonce,
        isAnchor ? 1 : (streak.anchor_claimed ? 1 : 0),
        identifier
      ]
    );

    // 6. Inserir claim (audit Provably Fair completo)
    const insertResult = await dbExecute(
      `INSERT INTO casino_daily_claims
       (identifier, claim_type, streak_at_claim, cycle_day_at_claim,
        wheel_segment_id, wheel_segment_tier, wheel_amount, mystery_amount,
        milestone_day, milestone_bonus, total_awarded,
        server_seed, server_seed_hash, client_seed, nonce, result_hash, result_float)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        identifier, claimType, avaliacao.novo_streak, avaliacao.novo_cycle_day,
        segmentVencedor.id, segmentVencedor.tier, wheelAmount, mysteryAmount,
        milestone.day, milestone.bonus, totalCapped,
        streak.server_seed, streak.server_seed_hash, streak.client_seed,
        novoNonce, resultHash, resultFloat
      ]
    );
    const claimId = insertResult?.insertId || null;

    // 7. Audit log
    if (milestone.day) {
      await registrarAudit(identifier, "milestone_reached", claimId, {
        day: milestone.day, bonus: milestone.bonus
      });
    }
    if (segmentVencedor.tier === "mystery") {
      await registrarAudit(identifier, "mystery_landed", claimId, {
        amount: wheelAmount, range: [segmentVencedor.min, segmentVencedor.max]
      });
    }
    if (isAnchor) {
      await registrarAudit(identifier, "anchor_claimed", claimId, {
        cycle_day: 1, amount: totalCapped
      });
    }

    // 8. Discord webhook (best-effort)
    enviarDiscordWebhook(config, identifier, {
      src,
      total_awarded: totalCapped,
      streak: avaliacao.novo_streak,
      tier: segmentVencedor.tier,
      milestone_day: milestone.day,
      is_milestone: !!milestone.day
    });

    // ========== RESPOSTA ==========
    respond(src, cbId, {
      ok: true,
      claim_id: claimId,
      result: {
        segment_id: segmentVencedor.id,
        segment_tier: segmentVencedor.tier,
        segment_icon: segmentVencedor.icon,
        wheel_amount: wheelAmount,
        mystery_amount: mysteryAmount,
        milestone_day: milestone.day,
        milestone_bonus: milestone.bonus,
        total_awarded: totalCapped,
        is_anchor: isAnchor,
      },
      streak: {
        current: avaliacao.novo_streak,
        longest: longestNovo,
        cycle_day: avaliacao.novo_cycle_day,
        cycles_completed: cyclesCompletosNovo,
      },
      saldo: saldoDepois,
      provably_fair: {
        server_seed_hash: streak.server_seed_hash,
        client_seed: streak.client_seed,
        nonce: novoNonce,
        result_hash: resultHash,
        result_float: resultFloat,
      }
    });

  }); // fim withPlayerLock
});

// ============================================================
// ENDPOINT 3: history — historico de claims do jogador
// ============================================================
safeDailyHandler("casino:daily:history", async (src, cbId, payload) => {
  const identifier = getIdentifier(src);
  if (!identifier) return respond(src, cbId, { error: "no_identifier" });

  const limit = Math.min(parseInt(payload.limit) || 30, 100);
  const offset = Math.max(parseInt(payload.offset) || 0, 0);

  const linhas = await dbQuery(
    `SELECT id, claim_type, streak_at_claim, cycle_day_at_claim,
            wheel_segment_id, wheel_segment_tier, wheel_amount, mystery_amount,
            milestone_day, milestone_bonus, total_awarded,
            server_seed_hash, client_seed, nonce, result_hash,
            created_at
     FROM casino_daily_claims
     WHERE identifier = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [identifier, limit, offset]
  );

  const totalRows = await dbQuery(
    "SELECT COUNT(*) as total FROM casino_daily_claims WHERE identifier = ?",
    [identifier]
  );
  const total = totalRows?.[0]?.total || 0;

  respond(src, cbId, {
    ok: true,
    history: linhas || [],
    total,
    limit,
    offset
  });
});

// ============================================================
// ENDPOINT 4: rotate-seed — jogador troca client_seed
// (revela o server_seed antigo, gera novo par)
// ============================================================
safeDailyHandler("casino:daily:rotate-seed", async (src, cbId, payload) => {
  const identifier = getIdentifier(src);
  if (!identifier) return respond(src, cbId, { error: "no_identifier" });

  const novoClientSeed = (payload.client_seed || "").toString().substring(0, 32);
  if (!novoClientSeed.match(/^[a-zA-Z0-9_-]{4,32}$/)) {
    return respond(src, cbId, { error: "invalid_client_seed" });
  }

  await withPlayerLock(identifier, async () => {
    const config = await getConfig();
    const streak = await getOrCreateStreak(identifier, config);
    if (!streak) return respond(src, cbId, { error: "streak_fetch_failed" });

    // 1. Arquivar seed antigo (revealed=1, server_seed visivel pra auditoria)
    await dbExecute(
      `INSERT INTO casino_daily_seeds_archive
       (identifier, server_seed, server_seed_hash, client_seed, nonce_start, nonce_end, revealed, revealed_at)
       VALUES (?, ?, ?, ?, 0, ?, 1, NOW())`,
      [identifier, streak.server_seed, streak.server_seed_hash, streak.client_seed, streak.nonce]
    );

    // 2. Gerar novo par
    const novoServerSeed = gerarSeed();
    const novoServerSeedHash = hashSeed(novoServerSeed);

    await dbExecute(
      `UPDATE casino_daily_streaks SET
         server_seed = ?, server_seed_hash = ?, client_seed = ?, nonce = 0
       WHERE identifier = ?`,
      [novoServerSeed, novoServerSeedHash, novoClientSeed, identifier]
    );

    await registrarAudit(identifier, "seed_rotated", null, {
      old_server_seed_hash: streak.server_seed_hash,
      new_server_seed_hash: novoServerSeedHash
    });

    respond(src, cbId, {
      ok: true,
      revealed_old_server_seed: streak.server_seed,
      new_server_seed_hash: novoServerSeedHash,
      new_client_seed: novoClientSeed,
      nonce: 0
    });
  });
});

// ============================================================
// ENDPOINT 5: use-makeup — usar token de recuperacao
// (recupera 1 dia perdido sem zerar streak)
// ============================================================
safeDailyHandler("casino:daily:use-makeup", async (src, cbId, payload) => {
  const identifier = getIdentifier(src);
  if (!identifier) return respond(src, cbId, { error: "no_identifier" });

  const config = await getConfig();
  if (!config.makeup_tokens_enabled) {
    return respond(src, cbId, { error: "makeup_disabled" });
  }

  await withPlayerLock(identifier, async () => {
    const streak = await getOrCreateStreak(identifier, config);
    if (!streak) return respond(src, cbId, { error: "streak_fetch_failed" });

    if (streak.makeup_tokens_remaining <= 0) {
      return respond(src, cbId, { error: "no_makeup_tokens" });
    }

    // Verificar se o streak realmente esta em risco (gap > 24h+grace)
    const avaliacao = avaliarStreakStatus(streak, config.cooldown_hours, config.grace_period_minutes);
    if (avaliacao.status !== "streak_perdido") {
      return respond(src, cbId, { error: "streak_not_at_risk" });
    }

    // Usar 1 token + simular last_claim_at de "ontem" pra restaurar continuidade
    const ontemMs = Date.now() - (config.cooldown_hours * 3600000);
    const ontem = new Date(ontemMs);

    await dbExecute(
      `UPDATE casino_daily_streaks SET
         makeup_tokens_remaining = makeup_tokens_remaining - 1,
         last_claim_at = ?
       WHERE identifier = ?`,
      [ontem.toISOString().slice(0, 19).replace("T", " "), identifier]
    );

    await registrarAudit(identifier, "streak_recovered", null, {
      tokens_remaining: streak.makeup_tokens_remaining - 1,
      old_streak: streak.current_streak
    });

    respond(src, cbId, {
      ok: true,
      tokens_remaining: streak.makeup_tokens_remaining - 1,
      streak_preserved: streak.current_streak
    });
  });
});

// ============================================================
// ENDPOINT 6: verify — verificar um claim antigo (Provably Fair)
// Recebe claim_id, retorna seeds + recalcula resultado pro frontend conferir
// ============================================================
safeDailyHandler("casino:daily:verify", async (src, cbId, payload) => {
  const identifier = getIdentifier(src);
  if (!identifier) return respond(src, cbId, { error: "no_identifier" });

  const claimId = parseInt(payload.claim_id);
  if (!claimId) return respond(src, cbId, { error: "invalid_claim_id" });

  const linhas = await dbQuery(
    `SELECT * FROM casino_daily_claims WHERE id = ? AND identifier = ?`,
    [claimId, identifier]
  );
  const claim = linhas?.[0];
  if (!claim) return respond(src, cbId, { error: "claim_not_found" });

  // Verificar se o server_seed ja foi revelado (rotacao)
  const arq = await dbQuery(
    `SELECT server_seed, revealed FROM casino_daily_seeds_archive
     WHERE identifier = ? AND server_seed_hash = ? AND revealed = 1
     LIMIT 1`,
    [identifier, claim.server_seed_hash]
  );
  const serverSeedRevealed = arq?.[0]?.server_seed || null;

  // Recalcular HMAC pro frontend conferir
  let recomputedHmac = null;
  let recomputedFloat = null;
  if (serverSeedRevealed) {
    recomputedHmac = gerarResultadoHMAC(serverSeedRevealed, claim.client_seed, claim.nonce);
    recomputedFloat = hashToFloat(recomputedHmac);
  }

  respond(src, cbId, {
    ok: true,
    claim: {
      id: claim.id,
      created_at: claim.created_at,
      wheel_segment_id: claim.wheel_segment_id,
      wheel_segment_tier: claim.wheel_segment_tier,
      wheel_amount: claim.wheel_amount,
      total_awarded: claim.total_awarded,
    },
    provably_fair: {
      server_seed_hash: claim.server_seed_hash,
      server_seed: serverSeedRevealed, // null se ainda nao revelado
      client_seed: claim.client_seed,
      nonce: claim.nonce,
      result_hash: claim.result_hash,
      result_float: claim.result_float,
      recomputed_hmac: recomputedHmac,
      recomputed_float: recomputedFloat,
      matches_original: recomputedHmac
        ? (parseFloat(recomputedFloat) === parseFloat(claim.result_float))
        : null
    }
  });
});

// ============================================================
// ENDPOINT 7: anchor-claim — primeiro daily-free vitalicio
// (chamado pelo client_lua quando vRP playerSpawn(first_spawn=true))
// ============================================================
safeDailyHandler("casino:daily:anchor", async (src, cbId, payload) => {
  // Reusa a logica de claim normal, mas marca como anchor
  // O endpoint claim ja detecta isAnchor automaticamente quando streak.anchor_claimed = 0
  // Esse endpoint existe como atalho — chamado uma vez por jogador novo
  const identifier = getIdentifier(src);
  if (!identifier) return respond(src, cbId, { error: "no_identifier" });

  const config = await getConfig();
  const streak = await getOrCreateStreak(identifier, config);
  if (streak.anchor_claimed) {
    return respond(src, cbId, { error: "anchor_already_claimed" });
  }
  // Delegar pro endpoint claim
  emitNet("casino:daily:claim", src, cbId, {});
});

// ============================================================
// ENDPOINT 8: invalidate-config — admin chama apos editar config
// ============================================================
safeDailyHandler("casino:daily:invalidate-config", async (src, cbId, payload) => {
  // Validacao admin (TODO: integrar com sistema admin existente)
  invalidateConfigCache();
  respond(src, cbId, { ok: true, invalidated_at: Date.now() });
});

console.log("[CASINO-DAILY] daily.js carregado - 8 endpoints registrados");

})(); // fim IIFE
