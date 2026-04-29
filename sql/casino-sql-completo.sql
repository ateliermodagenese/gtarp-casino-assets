-- Blackout Casino — Schema do Painel Flutuante
-- Compativel com MariaDB 10.6+ e MySQL 8.0+
-- Usar com oxmysql (prepared statements)

-- Conta GCoin do jogador no cassino
CREATE TABLE IF NOT EXISTS casino_accounts (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  identifier  VARCHAR(60)  NOT NULL UNIQUE,
  gcoin_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_deposited DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_withdrawn DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_wagered   DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_won       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_identifier (identifier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historico de transacoes (audit log — regra X12)
CREATE TABLE IF NOT EXISTS casino_transactions (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  identifier  VARCHAR(60)  NOT NULL,
  tipo        ENUM('deposit','withdraw','bet','win','refund','bonus') NOT NULL,
  valor       DECIMAL(12,2) NOT NULL,
  saldo_antes DECIMAL(12,2) NOT NULL,
  saldo_depois DECIMAL(12,2) NOT NULL,
  jogo        VARCHAR(40)  DEFAULT NULL,
  detalhes    VARCHAR(255) DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_identifier_data (identifier, created_at),
  INDEX idx_tipo (tipo),
  INDEX idx_jogo (jogo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuracoes do cassino (admin pode ajustar sem restart)
CREATE TABLE IF NOT EXISTS casino_config (
  chave       VARCHAR(60) NOT NULL PRIMARY KEY,
  valor       VARCHAR(255) NOT NULL,
  descricao   VARCHAR(255) DEFAULT NULL,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seeds de configuracao padrao
INSERT INTO casino_config (chave, valor, descricao) VALUES
  ('gcoin_rate',           '1.05',   'Preco de 1 GCoin em R$ (1 GCoin = R$1.05)'),
  ('min_deposit',          '10',     'Deposito minimo em GCoin'),
  ('max_deposit',          '50000',  'Deposito maximo por transacao'),
  ('min_withdraw',         '50',     'Saque minimo em GCoin'),
  ('max_withdraw',         '100000', 'Saque maximo por transacao'),
  ('withdraw_tax_percent', '2',      'Taxa de saque em percentual'),
  ('daily_deposit_limit',  '200000', 'Limite diario de deposito'),
  ('daily_withdraw_limit', '100000', 'Limite diario de saque'),
  ('cooldown_seconds',     '3',      'Cooldown entre transacoes do mesmo jogador'),
  ('casino_enabled',       '1',      'Cassino aberto (1) ou fechado (0)')
ON DUPLICATE KEY UPDATE chave = chave;
-- Blackout Casino — Slot Machine Schema
-- Compativel com MariaDB 10.6+ e MySQL 8.0+
-- Usar com oxmysql (prepared statements, ? placeholders)
-- Depende de: casino_accounts (panel.sql)

-- Sessoes de jogo (1 sessao = 1 periodo de jogo com mesmo server seed)
CREATE TABLE IF NOT EXISTS casino_slot_sessions (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  identifier      VARCHAR(60)  NOT NULL,
  mode            ENUM('video','classic') NOT NULL DEFAULT 'video',
  server_seed     VARCHAR(64)  NOT NULL,
  server_seed_hash VARCHAR(64) NOT NULL,
  client_seed     VARCHAR(32)  NOT NULL,
  nonce_start     INT UNSIGNED NOT NULL DEFAULT 0,
  nonce_end       INT UNSIGNED DEFAULT NULL,
  total_bet       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_won       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  spins_count     INT UNSIGNED NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at       TIMESTAMP DEFAULT NULL,
  INDEX idx_identifier (identifier),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cada spin individual (auditoria completa)
CREATE TABLE IF NOT EXISTS casino_slot_spins (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id      BIGINT UNSIGNED NOT NULL,
  identifier      VARCHAR(60)  NOT NULL,
  mode            ENUM('video','classic') NOT NULL,
  nonce           INT UNSIGNED NOT NULL,
  bet             DECIMAL(12,2) NOT NULL,
  ante_bet        TINYINT(1) NOT NULL DEFAULT 0,
  total_bet       DECIMAL(12,2) NOT NULL,
  win             DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  multiplier      DECIMAL(8,2) NOT NULL DEFAULT 1.00,
  tumbles         INT UNSIGNED NOT NULL DEFAULT 0,
  scatter_count   INT UNSIGNED NOT NULL DEFAULT 0,
  free_spins_triggered TINYINT(1) NOT NULL DEFAULT 0,
  is_buy_bonus    TINYINT(1) NOT NULL DEFAULT 0,
  is_jackpot      TINYINT(1) NOT NULL DEFAULT 0,
  jackpot_win     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  saldo_antes     DECIMAL(14,2) NOT NULL,
  saldo_depois    DECIMAL(14,2) NOT NULL,
  grid_hash       VARCHAR(64)  DEFAULT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session (session_id),
  INDEX idx_identifier_data (identifier, created_at),
  INDEX idx_mode (mode),
  CONSTRAINT fk_spin_session FOREIGN KEY (session_id) REFERENCES casino_slot_sessions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jackpot progressivo do slot machine
CREATE TABLE IF NOT EXISTS casino_slot_jackpot (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pool            DECIMAL(14,2) NOT NULL DEFAULT 10000.00,
  last_winner     VARCHAR(60)  DEFAULT NULL,
  last_win_amount DECIMAL(14,2) DEFAULT NULL,
  last_win_at     TIMESTAMP DEFAULT NULL,
  total_contributed DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_paid      DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed inicial do jackpot
INSERT INTO casino_slot_jackpot (pool) VALUES (10000.00)
ON DUPLICATE KEY UPDATE id = id;

-- Config especifica do slot (complementa casino_config do panel.sql)
INSERT INTO casino_config (chave, valor, descricao) VALUES
  ('slot_rtp_target',           '96.50',  'RTP alvo do slot machine (%)'),
  ('slot_volatility',           'high',   'Volatilidade: low/medium/high'),
  ('slot_min_bet',              '1',      'Aposta minima GCoin'),
  ('slot_max_bet',              '500',    'Aposta maxima GCoin'),
  ('slot_buy_bonus_mult',       '100',    'Multiplicador buy bonus (bet * N)'),
  ('slot_ante_bet_mod',         '1.25',   'Modificador ante bet (bet * N)'),
  ('slot_fs_count',             '10',     'Free spins por trigger'),
  ('slot_fs_scatter_req',       '4',      'Scatters para trigger FS'),
  ('slot_jackpot_contrib',      '1.5',    'Contribuicao jackpot por spin (%)'),
  ('slot_max_win_mult',         '5000',   'Multiplicador maximo de win'),
  ('slot_cooldown_ms',          '1000',   'Cooldown entre spins (ms) anti-exploit'),
  ('slot_max_spins_per_min',    '30',     'Max spins por minuto anti-bot'),
  ('slot_enabled',              '1',      'Slot machine habilitado (1/0)')
ON DUPLICATE KEY UPDATE chave = chave;

-- View para relatorio admin (ultimos 100 spins)
CREATE OR REPLACE VIEW v_slot_recent_spins AS
SELECT
  s.id,
  s.identifier,
  s.mode,
  s.bet,
  s.total_bet,
  s.win,
  s.multiplier,
  s.tumbles,
  s.free_spins_triggered,
  s.is_buy_bonus,
  s.is_jackpot,
  s.saldo_antes,
  s.saldo_depois,
  s.created_at
FROM casino_slot_spins s
ORDER BY s.created_at DESC
LIMIT 100;

-- View para stats por jogador
CREATE OR REPLACE VIEW v_slot_player_stats AS
SELECT
  identifier,
  COUNT(*) as total_spins,
  SUM(total_bet) as total_wagered,
  SUM(win) as total_won,
  ROUND(SUM(win) / NULLIF(SUM(total_bet), 0) * 100, 2) as rtp_real,
  MAX(win) as biggest_win,
  MAX(multiplier) as biggest_multiplier,
  SUM(CASE WHEN is_jackpot = 1 THEN 1 ELSE 0 END) as jackpots_won,
  SUM(CASE WHEN free_spins_triggered = 1 THEN 1 ELSE 0 END) as fs_triggered,
  MIN(created_at) as first_spin,
  MAX(created_at) as last_spin
FROM casino_slot_spins
GROUP BY identifier;
-- Blackout Casino - Jogo do Bicho (#9) - Schema MySQL
-- Compativel com MariaDB 10.3+ e MySQL 5.7+
-- Usar com oxmysql (prepared statements)
-- Executar APOS panel.sql (depende de casino_accounts)

-- Config especifica do Jogo do Bicho (admin ajusta sem restart)
CREATE TABLE IF NOT EXISTS casino_bicho_config (
    id INT PRIMARY KEY DEFAULT 1,
    bet_min INT NOT NULL DEFAULT 50,
    bet_max_simple INT NOT NULL DEFAULT 5000,
    bet_max_dupla INT NOT NULL DEFAULT 2000,
    bet_max_tripla INT NOT NULL DEFAULT 1000,
    bet_max_quadra INT NOT NULL DEFAULT 500,
    bet_max_quina INT NOT NULL DEFAULT 200,
    mult_simple_first INT NOT NULL DEFAULT 12,
    mult_simple_other INT NOT NULL DEFAULT 3,
    mult_dupla_first INT NOT NULL DEFAULT 90,
    mult_dupla_other INT NOT NULL DEFAULT 10,
    mult_tripla_first INT NOT NULL DEFAULT 650,
    mult_tripla_other INT NOT NULL DEFAULT 40,
    mult_quadra_first INT NOT NULL DEFAULT 3500,
    mult_quadra_other INT NOT NULL DEFAULT 180,
    mult_quina_first INT NOT NULL DEFAULT 15000,
    mult_quina_other INT NOT NULL DEFAULT 1200,
    cooldown_ms INT NOT NULL DEFAULT 3000,
    max_rounds_per_hour INT NOT NULL DEFAULT 60,
    max_payout INT NOT NULL DEFAULT 3000000,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO casino_bicho_config (id) VALUES (1);


-- Rodadas/sorteios do Jogo do Bicho
CREATE TABLE IF NOT EXISTS casino_bicho_rounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(64) NOT NULL,
    mode VARCHAR(16) NOT NULL,
    animals_selected JSON DEFAULT NULL,
    bet_amount INT NOT NULL,
    server_seed VARCHAR(64) NOT NULL,
    server_seed_hash VARCHAR(64) NOT NULL,
    client_seed VARCHAR(64) NOT NULL,
    nonce INT NOT NULL DEFAULT 0,
    result_hash VARCHAR(64) NOT NULL,
    prize_1_milhar VARCHAR(4) NOT NULL,
    prize_1_grupo INT NOT NULL,
    prize_2_milhar VARCHAR(4) NOT NULL,
    prize_2_grupo INT NOT NULL,
    prize_3_milhar VARCHAR(4) NOT NULL,
    prize_3_grupo INT NOT NULL,
    prize_4_milhar VARCHAR(4) NOT NULL,
    prize_4_grupo INT NOT NULL,
    prize_5_milhar VARCHAR(4) NOT NULL,
    prize_5_grupo INT NOT NULL,
    won TINYINT(1) NOT NULL DEFAULT 0,
    payout_amount INT NOT NULL DEFAULT 0,
    payout_multiplier DECIMAL(8,2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_identifier (identifier),
    INDEX idx_created (created_at),
    INDEX idx_won (won)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Audit log do Jogo do Bicho
CREATE TABLE IF NOT EXISTS casino_bicho_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(64) DEFAULT NULL,
    action VARCHAR(32) NOT NULL,
    round_id INT DEFAULT NULL,
    details JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_identifier_action (identifier, action),
    INDEX idx_round (round_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Queries admin uteis (NAO executar, somente referencia)
-- Total rodadas: SELECT COUNT(*) FROM casino_bicho_rounds;
-- Lucro casa: SELECT SUM(bet_amount) - SUM(payout_amount) FROM casino_bicho_rounds;
-- Top wins: SELECT * FROM casino_bicho_rounds WHERE won=1 ORDER BY payout_amount DESC LIMIT 10;
-- Stats por animal: SELECT prize_1_grupo, COUNT(*) FROM casino_bicho_rounds GROUP BY prize_1_grupo;
