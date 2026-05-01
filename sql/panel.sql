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
  ('casino_enabled',       '1',      'Cassino aberto (1) ou fechado (0)'),
  ('slot_enabled',         '1',      'Slot Machine habilitado (1) ou desabilitado (0)')
ON DUPLICATE KEY UPDATE chave = chave;
