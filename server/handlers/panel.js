// Blackout Casino — Panel Handler (server-side JS)
// TODOS os handlers envolvidos em try/catch — erro nunca morre mudo

const RESPONSE_EVENT = "casino:panel:response";

// Helper DB: callback explicito wrappado em Promise (unico padrao que funciona no FiveM JS)
// Timeout 5s: se oxmysql nao chamar callback (ex: erro silencioso), resolve null e loga
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

function getIdentifier(src) {
  const numIds = GetNumPlayerIdentifiers(src);
  for (let i = 0; i < numIds; i++) {
    const id = GetPlayerIdentifier(src, i);
    if (id && id.startsWith("license:")) return id;
  }
  return null;
}

function respond(src, cbId, data) {
  emitNet(RESPONSE_EVENT, src, cbId, data);
}

// getSaldo
RegisterNetEvent("casino:panel:getSaldo");
on("casino:panel:getSaldo", async (cbId) => {
  const src = source;
  console.log(`[CASINO-PANEL] getSaldo src=${src} cbId=${cbId}`);
  try {
    const identifier = getIdentifier(src);
    if (!identifier) return respond(src, cbId, { erro: "Sem identifier" });

    await dbExecute(
      "INSERT IGNORE INTO casino_accounts (identifier, gcoin_balance) VALUES (?, 0.00)",
      [identifier]
    );

    const rows = await dbQuery(
      "SELECT gcoin_balance FROM casino_accounts WHERE identifier = ?",
      [identifier]
    );

    const saldo = rows?.[0]?.gcoin_balance ?? 0;
    console.log(`[CASINO-PANEL] getSaldo OK saldo=${saldo}`);
    respond(src, cbId, { gcoin_balance: parseFloat(saldo) });
  } catch (err) {
    console.log(`[CASINO-PANEL] getSaldo ERRO: ${err.message}`);
    respond(src, cbId, { erro: err.message });
  }
});

// buyGCoin
RegisterNetEvent("casino:panel:buyGCoin");
on("casino:panel:buyGCoin", async (cbId, payload) => {
  const src = source;
  console.log(`[CASINO-PANEL] buyGCoin src=${src} cbId=${cbId} payload=${JSON.stringify(payload)}`);
  try {
    const identifier = getIdentifier(src);
    if (!identifier) return respond(src, cbId, { sucesso: false, mensagem: "Sem identifier" });

    const valor = parseFloat(payload?.amount || payload);
    if (isNaN(valor) || valor <= 0) return respond(src, cbId, { sucesso: false, mensagem: "Valor invalido" });

    await dbExecute(
      "INSERT IGNORE INTO casino_accounts (identifier, gcoin_balance) VALUES (?, 0.00)",
      [identifier]
    );

    const rows = await dbQuery(
      "SELECT gcoin_balance FROM casino_accounts WHERE identifier = ?",
      [identifier]
    );
    const saldoAntes = parseFloat(rows?.[0]?.gcoin_balance ?? 0);

    const debitou = exports.bc_casino.debitarDinheiro(src, valor);
    if (!debitou) return respond(src, cbId, { sucesso: false, mensagem: "Dinheiro insuficiente" });

    const saldoDepois = saldoAntes + valor;
    await dbExecute(
      "UPDATE casino_accounts SET gcoin_balance = ?, total_deposited = total_deposited + ? WHERE identifier = ?",
      [saldoDepois, valor, identifier]
    );

    await dbExecute(
      "INSERT INTO casino_transactions (identifier, tipo, valor, saldo_antes, saldo_depois, jogo, detalhes) VALUES (?, 'deposit', ?, ?, ?, NULL, ?)",
      [identifier, valor, saldoAntes, saldoDepois, `Deposito ${valor} GC via carteira`]
    );

    console.log(`[CASINO-PANEL] buyGCoin OK ${saldoAntes} -> ${saldoDepois}`);
    respond(src, cbId, { sucesso: true, novoSaldo: saldoDepois });
    emitNet("casino:saldoAtualizado", src, { gcoin: saldoDepois });
  } catch (err) {
    console.log(`[CASINO-PANEL] buyGCoin ERRO: ${err.message}`);
    respond(src, cbId, { sucesso: false, mensagem: err.message });
  }
});

// cashoutGCoin
RegisterNetEvent("casino:panel:cashoutGCoin");
on("casino:panel:cashoutGCoin", async (cbId, payload) => {
  const src = source;
  console.log(`[CASINO-PANEL] cashoutGCoin src=${src} cbId=${cbId}`);
  try {
    const identifier = getIdentifier(src);
    if (!identifier) return respond(src, cbId, { sucesso: false, mensagem: "Sem identifier" });

    const valor = parseFloat(payload?.amount || payload);
    if (isNaN(valor) || valor <= 0) return respond(src, cbId, { sucesso: false, mensagem: "Valor invalido" });

    await dbExecute(
      "INSERT IGNORE INTO casino_accounts (identifier, gcoin_balance) VALUES (?, 0.00)",
      [identifier]
    );

    const rows = await dbQuery(
      "SELECT gcoin_balance FROM casino_accounts WHERE identifier = ?",
      [identifier]
    );
    const saldoAntes = parseFloat(rows?.[0]?.gcoin_balance ?? 0);
    if (saldoAntes < valor) return respond(src, cbId, { sucesso: false, mensagem: "Saldo insuficiente" });

    const saldoDepois = saldoAntes - valor;
    await dbExecute(
      "UPDATE casino_accounts SET gcoin_balance = ?, total_withdrawn = total_withdrawn + ? WHERE identifier = ?",
      [saldoDepois, valor, identifier]
    );

    const creditou = exports.bc_casino.creditarDinheiro(src, valor);

    await dbExecute(
      "INSERT INTO casino_transactions (identifier, tipo, valor, saldo_antes, saldo_depois, jogo, detalhes) VALUES (?, 'withdraw', ?, ?, ?, NULL, ?)",
      [identifier, valor, saldoAntes, saldoDepois, `Saque ${valor} GC para carteira`]
    );

    console.log(`[CASINO-PANEL] cashoutGCoin OK ${saldoAntes} -> ${saldoDepois}`);
    respond(src, cbId, { sucesso: true, novoSaldo: saldoDepois });
    emitNet("casino:saldoAtualizado", src, { gcoin: saldoDepois });
  } catch (err) {
    console.log(`[CASINO-PANEL] cashoutGCoin ERRO: ${err.message}`);
    respond(src, cbId, { sucesso: false, mensagem: err.message });
  }
});

// getHistory
RegisterNetEvent("casino:panel:getHistory");
on("casino:panel:getHistory", async (cbId, payload) => {
  const src = source;
  console.log(`[CASINO-PANEL] getHistory src=${src} cbId=${cbId}`);
  try {
    const identifier = getIdentifier(src);
    if (!identifier) return respond(src, cbId, []);

    const limite = parseInt(payload?.limite || payload) || 50;
    const maxRows = Math.min(limite, 200);

    const rows = await dbQuery(
      "SELECT tipo, valor, saldo_depois, jogo, detalhes, created_at FROM casino_transactions WHERE identifier = ? ORDER BY created_at DESC LIMIT ?",
      [identifier, maxRows]
    );

    console.log(`[CASINO-PANEL] getHistory OK rows=${(rows||[]).length}`);
    respond(src, cbId, rows || []);
  } catch (err) {
    console.log(`[CASINO-PANEL] getHistory ERRO: ${err.message}`);
    respond(src, cbId, []);
  }
});

// getConfig
RegisterNetEvent("casino:panel:getConfig");
on("casino:panel:getConfig", async (cbId) => {
  const src = source;
  console.log(`[CASINO-PANEL] getConfig src=${src} cbId=${cbId}`);
  try {
    const rows = await dbQuery("SELECT chave, valor FROM casino_config");
    const config = {};
    for (const row of (rows || [])) config[row.chave] = row.valor;
    console.log(`[CASINO-PANEL] getConfig OK`);
    respond(src, cbId, config);
  } catch (err) {
    console.log(`[CASINO-PANEL] getConfig ERRO: ${err.message}`);
    respond(src, cbId, {});
  }
});

// getWalletBalance — saldo carteira + banco do vRP
RegisterNetEvent("casino:panel:getWalletBalance");
on("casino:panel:getWalletBalance", async (cbId) => {
  const src = source;
  console.log(`[CASINO-PANEL] getWalletBalance src=${src} cbId=${cbId}`);
  try {
    const carteira = exports.bc_casino.consultarSaldo(src);
    const banco = exports.bc_casino.consultarBanco(src);
    console.log(`[CASINO-PANEL] getWalletBalance OK carteira=${carteira} banco=${banco}`);
    respond(src, cbId, {
      carteira: parseFloat(carteira) || 0,
      banco: parseFloat(banco) || 0,
    });
  } catch (err) {
    console.log(`[CASINO-PANEL] getWalletBalance ERRO: ${err.message}`);
    respond(src, cbId, { carteira: 0, banco: 0 });
  }
});

// getHistoryFiltered — historico com filtros (tipo, data, paginacao)
RegisterNetEvent("casino:panel:getHistoryFiltered");
on("casino:panel:getHistoryFiltered", async (cbId, payload) => {
  const src = source;
  try {
    const identifier = getIdentifier(src);
    if (!identifier) return respond(src, cbId, { rows: [], total: 0 });

    const tipo = payload?.tipo || null;
    const dataInicio = payload?.dataInicio || null;
    const dataFim = payload?.dataFim || null;
    const page = Math.max(1, parseInt(payload?.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(payload?.limit) || 15));
    const offset = (page - 1) * limit;

    let where = "identifier = ?";
    const params = [identifier];

    if (tipo) {
      where += " AND tipo = ?";
      params.push(tipo);
    }
    if (dataInicio) {
      where += " AND created_at >= ?";
      params.push(dataInicio + " 00:00:00");
    }
    if (dataFim) {
      where += " AND created_at <= ?";
      params.push(dataFim + " 23:59:59");
    }

    const countRows = await dbQuery(
      `SELECT COUNT(*) as total FROM casino_transactions WHERE ${where}`,
      params
    );
    const total = countRows?.[0]?.total ?? 0;

    const paramsWithLimit = [...params, limit, offset];
    const rows = await dbQuery(
      `SELECT tipo, valor, saldo_antes, saldo_depois, jogo, detalhes, created_at FROM casino_transactions WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      paramsWithLimit
    );

    respond(src, cbId, { rows: rows || [], total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.log(`[CASINO-PANEL] getHistoryFiltered ERRO: ${err.message}`);
    respond(src, cbId, { rows: [], total: 0 });
  }
});

console.log("[Blackout Casino] Panel handlers carregados — 7 endpoints (try/catch em todos)");
