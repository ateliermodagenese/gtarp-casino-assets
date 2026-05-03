// Blackout Casino — Admin Handler (server-side JS)
// Autenticacao, config CRUD, troca de senha
// SHA256 via MySQL SHA2() — FiveM JS nao tem crypto nativo
// IIFE: escopo isolado pra evitar conflito de const com panel.js

(function() {

const RESPONSE_EVENT = "casino:panel:response";

function dbQuery(sql, params) {
  return new Promise((resolve) => {
    exports.oxmysql.query(sql, params || [], (result) => {
      resolve(result);
    });
  });
}
function dbExecute(sql, params) {
  return new Promise((resolve) => {
    exports.oxmysql.execute(sql, params || [], (result) => {
      resolve(result);
    });
  });
}

function respond(src, cbId, data) {
  emitNet(RESPONSE_EVENT, src, cbId, data);
}

// Sessoes ativas: Map<source, { token, expiresAt }>
const sessions = new Map();
const LOCKOUT_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const SESSION_TTL_MS = 15 * 60 * 1000;

function generateToken() {
  const chars = "abcdef0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

function isValidSession(src, token) {
  const session = sessions.get(src);
  if (!session) return false;
  if (session.token !== token) return false;
  if (Date.now() > session.expiresAt) {
    sessions.delete(src);
    return false;
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return true;
}

// ============================================================
// casino:admin:auth — Autenticar com senha
// ============================================================
RegisterNetEvent("casino:admin:auth");
on("casino:admin:auth", async (cbId, payload) => {
  const src = source;
  console.log(`[CASINO-ADMIN] auth src=${src} cbId=${cbId}`);
  console.log(`[CASINO-ADMIN] DEBUG payload=${JSON.stringify(payload)}`);
  try {
    const password = payload?.password;
    console.log(`[CASINO-ADMIN] DEBUG password="${password}" len=${password ? password.length : 0} type=${typeof password}`);
    if (!password || typeof password !== "string" || password.length < 1) {
      return respond(src, cbId, { autenticado: false, mensagem: "Senha vazia" });
    }

    const rows = await dbQuery("SELECT * FROM casino_admin_auth WHERE id = 1", []);
    console.log(`[CASINO-ADMIN] DEBUG rows=${JSON.stringify(rows?.[0] ? { setup: rows[0].setup_complete, hasmaster: !!rows[0].master_password, hasadmin: !!rows[0].admin_password } : 'NULL')}`);
    if (!rows || rows.length === 0) {
      return respond(src, cbId, { autenticado: false, mensagem: "Tabela admin nao configurada" });
    }

    const auth = rows[0];

    // Lockout check
    if (auth.locked_until) {
      const lockUntil = new Date(auth.locked_until).getTime();
      if (Date.now() < lockUntil) {
        const remainSec = Math.ceil((lockUntil - Date.now()) / 1000);
        return respond(src, cbId, {
          autenticado: false,
          bloqueado: true,
          mensagem: `Bloqueado por ${remainSec}s`,
        });
      }
      await dbExecute(
        "UPDATE casino_admin_auth SET failed_attempts = 0, locked_until = NULL WHERE id = 1",
        []
      );
      auth.failed_attempts = 0;
    }

    // Determine which password to check
    // oxmysql retorna TINYINT(1) como boolean (false/true), nao como 0/1
    const isSetup = !auth.setup_complete;
    const checkColumn = isSetup ? "master_password" : "admin_password";
    console.log(`[CASINO-ADMIN] DEBUG setup_complete=${auth.setup_complete} (type=${typeof auth.setup_complete}) isSetup=${isSetup} checkColumn=${checkColumn}`);

    const match = await dbQuery(
      `SELECT 1 AS ok FROM casino_admin_auth WHERE id = 1 AND ${checkColumn} = SHA2(?, 256)`,
      [password]
    );
    console.log(`[CASINO-ADMIN] DEBUG match=${JSON.stringify(match)}`);

    if (!match || match.length === 0) {
      const newAttempts = (auth.failed_attempts || 0) + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        await dbExecute(
          "UPDATE casino_admin_auth SET failed_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = 1",
          [newAttempts, LOCKOUT_MINUTES]
        );
        return respond(src, cbId, {
          autenticado: false,
          bloqueado: true,
          mensagem: `Bloqueado por ${LOCKOUT_MINUTES} minutos`,
        });
      }
      await dbExecute(
        "UPDATE casino_admin_auth SET failed_attempts = ? WHERE id = 1",
        [newAttempts]
      );
      return respond(src, cbId, {
        autenticado: false,
        mensagem: `Senha incorreta (${newAttempts}/${MAX_ATTEMPTS})`,
      });
    }

    // Sucesso — gerar token
    const token = generateToken();
    sessions.set(src, { token, expiresAt: Date.now() + SESSION_TTL_MS });

    await dbExecute(
      "UPDATE casino_admin_auth SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW(), last_login_ip = ? WHERE id = 1",
      [GetPlayerEndpoint(src) || "unknown"]
    );

    console.log(`[CASINO-ADMIN] auth OK src=${src} setupComplete=${auth.setup_complete}`);
    respond(src, cbId, {
      autenticado: true,
      token,
      setupComplete: !!auth.setup_complete,
    });
  } catch (err) {
    console.log(`[CASINO-ADMIN] auth ERRO: ${err.message}`);
    respond(src, cbId, { autenticado: false, mensagem: err.message });
  }
});

// ============================================================
// casino:admin:setup — Criar senha pessoal (primeira vez)
// ============================================================
RegisterNetEvent("casino:admin:setup");
on("casino:admin:setup", async (cbId, payload) => {
  const src = source;
  console.log(`[CASINO-ADMIN] setup src=${src} cbId=${cbId}`);
  try {
    if (!isValidSession(src, payload?.token)) {
      return respond(src, cbId, { sucesso: false, mensagem: "Sessao invalida" });
    }

    const newPassword = payload?.newPassword;
    if (!newPassword || newPassword.length < 6) {
      return respond(src, cbId, { sucesso: false, mensagem: "Senha deve ter no minimo 6 caracteres" });
    }

    const rows = await dbQuery("SELECT setup_complete FROM casino_admin_auth WHERE id = 1", []);
    if (rows?.[0]?.setup_complete) {
      return respond(src, cbId, { sucesso: false, mensagem: "Setup ja foi concluido" });
    }

    await dbExecute(
      "UPDATE casino_admin_auth SET admin_password = SHA2(?, 256), master_password = NULL, setup_complete = 1 WHERE id = 1",
      [newPassword]
    );

    console.log(`[CASINO-ADMIN] setup OK — senha mestre removida, admin_password criada`);
    respond(src, cbId, { sucesso: true, mensagem: "Senha criada com sucesso!" });
  } catch (err) {
    console.log(`[CASINO-ADMIN] setup ERRO: ${err.message}`);
    respond(src, cbId, { sucesso: false, mensagem: err.message });
  }
});

// ============================================================
// casino:admin:getConfig — Todas as configs com descricao
// ============================================================
RegisterNetEvent("casino:admin:getConfig");
on("casino:admin:getConfig", async (cbId, payload) => {
  const src = source;
  console.log(`[CASINO-ADMIN] getConfig src=${src} cbId=${cbId}`);
  try {
    if (!isValidSession(src, payload?.token)) {
      return respond(src, cbId, { sucesso: false, mensagem: "Sessao invalida" });
    }

    const rows = await dbQuery("SELECT chave, valor, descricao FROM casino_config ORDER BY chave", []);
    console.log(`[CASINO-ADMIN] getConfig OK rows=${(rows || []).length}`);
    respond(src, cbId, { sucesso: true, configs: rows || [] });
  } catch (err) {
    console.log(`[CASINO-ADMIN] getConfig ERRO: ${err.message}`);
    respond(src, cbId, { sucesso: false, mensagem: err.message });
  }
});

// ============================================================
// casino:admin:setConfig — Editar configs (batch)
// ============================================================
RegisterNetEvent("casino:admin:setConfig");
on("casino:admin:setConfig", async (cbId, payload) => {
  const src = source;
  console.log(`[CASINO-ADMIN] setConfig src=${src} cbId=${cbId}`);
  try {
    if (!isValidSession(src, payload?.token)) {
      return respond(src, cbId, { sucesso: false, mensagem: "Sessao invalida" });
    }

    const changes = payload?.changes;
    if (!changes || typeof changes !== "object") {
      return respond(src, cbId, { sucesso: false, mensagem: "Nenhuma alteracao enviada" });
    }

    let count = 0;
    const entries = Object.entries(changes);
    for (const [chave, valor] of entries) {
      if (typeof chave !== "string" || chave.length === 0) continue;
      await dbExecute(
        "UPDATE casino_config SET valor = ? WHERE chave = ?",
        [String(valor), chave]
      );
      count++;
    }

    console.log(`[CASINO-ADMIN] setConfig OK — ${count} configs atualizadas`);
    respond(src, cbId, { sucesso: true, mensagem: `${count} configuracoes salvas`, count });
  } catch (err) {
    console.log(`[CASINO-ADMIN] setConfig ERRO: ${err.message}`);
    respond(src, cbId, { sucesso: false, mensagem: err.message });
  }
});

// ============================================================
// casino:admin:changePassword — Trocar senha admin
// ============================================================
RegisterNetEvent("casino:admin:changePassword");
on("casino:admin:changePassword", async (cbId, payload) => {
  const src = source;
  console.log(`[CASINO-ADMIN] changePassword src=${src} cbId=${cbId}`);
  try {
    if (!isValidSession(src, payload?.token)) {
      return respond(src, cbId, { sucesso: false, mensagem: "Sessao invalida" });
    }

    const currentPassword = payload?.currentPassword;
    const newPassword = payload?.newPassword;

    if (!currentPassword || !newPassword) {
      return respond(src, cbId, { sucesso: false, mensagem: "Senhas nao informadas" });
    }
    if (newPassword.length < 6) {
      return respond(src, cbId, { sucesso: false, mensagem: "Nova senha deve ter no minimo 6 caracteres" });
    }

    const check = await dbQuery(
      "SELECT 1 AS ok FROM casino_admin_auth WHERE id = 1 AND admin_password = SHA2(?, 256)",
      [currentPassword]
    );

    if (!check || check.length === 0) {
      return respond(src, cbId, { sucesso: false, mensagem: "Senha atual incorreta" });
    }

    await dbExecute(
      "UPDATE casino_admin_auth SET admin_password = SHA2(?, 256) WHERE id = 1",
      [newPassword]
    );

    console.log(`[CASINO-ADMIN] changePassword OK`);
    respond(src, cbId, { sucesso: true, mensagem: "Senha alterada com sucesso!" });
  } catch (err) {
    console.log(`[CASINO-ADMIN] changePassword ERRO: ${err.message}`);
    respond(src, cbId, { sucesso: false, mensagem: err.message });
  }
});

// Cleanup de sessoes expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [src, session] of sessions) {
    if (now > session.expiresAt) sessions.delete(src);
  }
}, 5 * 60 * 1000);

console.log("[Blackout Casino] Admin handlers carregados — 5 endpoints (auth, setup, getConfig, setConfig, changePassword)");

// ============================================================
// ECONOMY KEYS — campos que vao pra casino_economy_config (nao casino_config)
// ============================================================
const ECONOMY_KEYS = ["global_multiplier", "currency_name", "currency_symbol", "currency_icon"];

// Cache da economy config (invalidado quando admin salva)
let economyCacheObj = null;
let economyCacheTime = 0;
const ECONOMY_CACHE_TTL = 30000; // 30s

async function getEconomyConfig() {
  const now = Date.now();
  if (economyCacheObj && (now - economyCacheTime) < ECONOMY_CACHE_TTL) {
    return economyCacheObj;
  }

  try {
    const rows = await dbQuery("SELECT * FROM casino_economy_config WHERE id = 1", []);
    if (rows && rows.length > 0) {
      economyCacheObj = rows[0];
      economyCacheTime = now;
      return rows[0];
    }
  } catch (err) {
    console.log(`[CASINO-ECONOMY] getEconomyConfig fallback — tabela pode nao existir: ${err.message}`);
  }

  // fallback se tabela nao existe
  return {
    global_multiplier: 1.0,
    currency_name: "GCoin",
    currency_symbol: "GC",
    currency_icon: "/assets/shared/icons/icon-gcoin.png",
  };
}

// ============================================================
// PATCH: getConfig agora inclui economy data
// ============================================================
RegisterNetEvent("casino:admin:getConfigWithEconomy");
on("casino:admin:getConfigWithEconomy", async (cbId, payload) => {
  const src = source;
  console.log(`[CASINO-ADMIN] getConfigWithEconomy src=${src} cbId=${cbId}`);
  try {
    if (!isValidSession(src, payload?.token)) {
      return respond(src, cbId, { sucesso: false, mensagem: "Sessao invalida" });
    }

    // Busca configs legadas
    const configRows = await dbQuery("SELECT chave, valor, descricao FROM casino_config ORDER BY chave", []);

    // Busca economy config
    const econ = await getEconomyConfig();

    // Injeta campos economy como se fossem casino_config (frontend trata igual)
    const economyRows = ECONOMY_KEYS.map(key => ({
      chave: key,
      valor: String(econ[key] ?? ""),
      descricao: null,
    }));

    const merged = [...(configRows || []), ...economyRows];
    console.log(`[CASINO-ADMIN] getConfigWithEconomy OK — ${(configRows || []).length} config + ${economyRows.length} economy`);
    respond(src, cbId, { sucesso: true, configs: merged });
  } catch (err) {
    console.log(`[CASINO-ADMIN] getConfigWithEconomy ERRO: ${err.message}`);
    respond(src, cbId, { sucesso: false, mensagem: err.message });
  }
});

// ============================================================
// PATCH: setConfig agora separa economy keys
// ============================================================
RegisterNetEvent("casino:admin:setConfigWithEconomy");
on("casino:admin:setConfigWithEconomy", async (cbId, payload) => {
  const src = source;
  console.log(`[CASINO-ADMIN] setConfigWithEconomy src=${src} cbId=${cbId}`);
  try {
    if (!isValidSession(src, payload?.token)) {
      return respond(src, cbId, { sucesso: false, mensagem: "Sessao invalida" });
    }

    const changes = payload?.changes;
    if (!changes || typeof changes !== "object") {
      return respond(src, cbId, { sucesso: false, mensagem: "Nenhuma alteracao enviada" });
    }

    let count = 0;
    const economyUpdates = {};
    const configUpdates = {};

    for (const [chave, valor] of Object.entries(changes)) {
      if (typeof chave !== "string" || chave.length === 0) continue;
      if (ECONOMY_KEYS.includes(chave)) {
        economyUpdates[chave] = valor;
      } else {
        configUpdates[chave] = valor;
      }
    }

    // Salvar economy keys em casino_economy_config
    if (Object.keys(economyUpdates).length > 0) {
      const setClauses = [];
      const params = [];
      for (const [key, val] of Object.entries(economyUpdates)) {
        setClauses.push(`${key} = ?`);
        params.push(String(val));
      }
      await dbExecute(
        `UPDATE casino_economy_config SET ${setClauses.join(", ")} WHERE id = 1`,
        params
      );
      count += Object.keys(economyUpdates).length;
      // Invalida cache
      economyCacheObj = null;
      economyCacheTime = 0;
    }

    // Salvar config keys legadas em casino_config
    for (const [chave, valor] of Object.entries(configUpdates)) {
      await dbExecute(
        "UPDATE casino_config SET valor = ? WHERE chave = ?",
        [String(valor), chave]
      );
      count++;
    }

    console.log(`[CASINO-ADMIN] setConfigWithEconomy OK — ${count} total (${Object.keys(economyUpdates).length} economy + ${Object.keys(configUpdates).length} config)`);
    respond(src, cbId, { sucesso: true, mensagem: `${count} configuracoes salvas`, count });
  } catch (err) {
    console.log(`[CASINO-ADMIN] setConfigWithEconomy ERRO: ${err.message}`);
    respond(src, cbId, { sucesso: false, mensagem: err.message });
  }
});

// ============================================================
// casino:economy:getConfig — PUBLICO (sem auth)
// Jogos chamam isso pra obter multiplier + moeda
// ============================================================
RegisterNetEvent("casino:economy:getConfig");
on("casino:economy:getConfig", async (cbId, payload) => {
  const src = source;
  try {
    const econ = await getEconomyConfig();
    const gameId = payload?.gameId;
    let overrideVal = null;

    // Buscar override do jogo especifico se tiver gameId
    if (gameId) {
      const tableMap = {
        "daily-free": "casino_daily_config",
        "slots": "casino_slots_config",
        "bicho": "casino_bicho_config",
        "blackjack": "casino_blackjack_config",
      };
      const table = tableMap[gameId];
      if (table) {
        try {
          const rows = await dbQuery(`SELECT multiplier_override FROM ${table} WHERE id = 1`, []);
          if (rows && rows[0] && rows[0].multiplier_override != null) {
            overrideVal = parseFloat(rows[0].multiplier_override);
          }
        } catch {
          // tabela pode nao ter a coluna ainda — ignora
        }
      }
    }

    respond(src, cbId, {
      global_multiplier: parseFloat(econ.global_multiplier) || 1.0,
      multiplier_override: overrideVal,
      currency_name: econ.currency_name || "GCoin",
      currency_symbol: econ.currency_symbol || "GC",
      currency_icon: econ.currency_icon || "/assets/shared/icons/icon-gcoin.png",
    });
  } catch (err) {
    console.log(`[CASINO-ECONOMY] getConfig ERRO: ${err.message}`);
    respond(src, cbId, {
      global_multiplier: 1.0,
      multiplier_override: null,
      currency_name: "GCoin",
      currency_symbol: "GC",
      currency_icon: "/assets/shared/icons/icon-gcoin.png",
    });
  }
});

console.log("[Blackout Casino] Economy handlers carregados — 3 endpoints (getConfigWithEconomy, setConfigWithEconomy, economy:getConfig)");

})();