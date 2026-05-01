-- =====================================================================
-- BLACKOUT CASINO — MIGRATION ECONOMIA (CIRÚRGICA)
-- Data: 01/05/2026
-- =====================================================================
-- O que faz:
--   1. Cria tabela casino_economy_config (multiplier global + currency)
--   2. Cria tabela casino_economy_reference (tabela de referência readonly)
--   3. Adiciona multiplier_override em CADA tabela de config dos jogos
--   4. Ajusta curva de milestones do Daily-Free (D21=1500, D28=2500)
--
-- O que NÃO faz:
--   ❌ Não dropa nada
--   ❌ Não muda dados existentes (exceto a curva de milestones)
--   ❌ Não quebra jogos que estão funcionando
--
-- Princípio: cada coluna multiplier_override é DEFAULT NULL → backend
-- atual ignora completamente. Quando você for calibrar cada jogo, aí
-- popula a coluna e atualiza o backend daquele jogo específico.
--
-- Pode rodar mesmo sem ter feito CLEANUP antes (mas recomendo CLEANUP primeiro).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CRIAR casino_economy_config (NOVA, coração do sistema)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS casino_economy_config (
  id INT UNSIGNED PRIMARY KEY DEFAULT 1,

  -- Multiplier global (cliente ajusta UM número pra escalar todo o casino)
  global_multiplier DECIMAL(8,2) NOT NULL DEFAULT 1.00
    COMMENT 'Multiplica TODOS os valores BASE do casino. Formula: salario_h / 10000',

  -- Moeda (cada cliente decide o nome/simbolo da moeda do servidor dele)
  currency_name VARCHAR(40) NOT NULL DEFAULT 'GCoin'
    COMMENT 'Nome da moeda exibida (ex: GCoin, Esmeralda, Reais Virtuais)',
  currency_symbol VARCHAR(8) NOT NULL DEFAULT 'GC'
    COMMENT 'Simbolo curto (ex: GC, ES, R$V)',
  currency_icon VARCHAR(255) NOT NULL DEFAULT '/assets/shared/icons/icon-gcoin.png'
    COMMENT 'Caminho/URL do icone da moeda',

  -- Help contextual (admin pode anotar info do servidor dele)
  reference_salary_per_hour INT DEFAULT 10000
    COMMENT 'Salario/hora medio do servidor cliente (ajuda calcular multiplier)',
  reference_notes TEXT DEFAULT NULL
    COMMENT 'Notas livres do admin sobre a economia',

  -- Meta
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(60) DEFAULT NULL,

  CONSTRAINT chk_multiplier_positive CHECK (global_multiplier > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default (multiplier 1.0 = "servidor medio")
INSERT INTO casino_economy_config (id, global_multiplier, currency_name, currency_symbol)
VALUES (1, 1.00, 'GCoin', 'GC')
ON DUPLICATE KEY UPDATE id = id;

-- ---------------------------------------------------------------------
-- 2. CRIAR casino_economy_reference (tabela de referencia, somente leitura)
-- ---------------------------------------------------------------------
-- Serve pra exibir no painel admin como guia visual de calibracao.
-- Cliente olha essa tabela pra saber qual multiplier escolher.
CREATE TABLE IF NOT EXISTS casino_economy_reference (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo_servidor VARCHAR(60) NOT NULL,
  salario_hora_min INT NOT NULL,
  salario_hora_max INT NOT NULL,
  multiplier_sugerido DECIMAL(8,2) NOT NULL,
  exemplo_servidores VARCHAR(255) DEFAULT NULL,
  ordem INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO casino_economy_reference
  (tipo_servidor, salario_hora_min, salario_hora_max, multiplier_sugerido, exemplo_servidores, ordem) VALUES
  ('Artesanal',         10,      500,     0.01, 'Servers RP super lentos, foco em imersao',  1),
  ('Low-eco',           500,     2000,    0.10, 'Servers low-economy, vida de baixa renda',  2),
  ('Low-mid',           2000,    7500,    0.50, 'Servers entre low e mid',                   3),
  ('Medio (default)',   7500,    15000,   1.00, 'Default do produto. ESX/QBCore baseline',   4),
  ('Mid-high',          15000,   75000,   5.00, 'Cidade Alta, Complexo, servers grandes BR', 5),
  ('High-eco',          75000,   200000,  10.00, 'Servers com economia inflada',             6),
  ('Hyper-eco',         200000,  9999999, 50.00, 'Servers experimentais, numeros enormes',   7)
ON DUPLICATE KEY UPDATE id = id;

-- ---------------------------------------------------------------------
-- 3. ADICIONAR multiplier_override em CADA tabela de config de jogo
-- ---------------------------------------------------------------------
-- IF NOT EXISTS evita erro se rodar 2x.
-- DEFAULT NULL = backend atual ignora a coluna (continua funcionando como antes).
-- Quando for calibrar um jogo, popula a coluna e atualiza o backend dele.

-- Daily-Free
ALTER TABLE casino_daily_config 
  ADD COLUMN IF NOT EXISTS multiplier_override DECIMAL(8,2) DEFAULT NULL
  COMMENT 'NULL = usa global_multiplier. Valor = override deste jogo.';

-- Slots (sistema novo, plural)
ALTER TABLE casino_slots_config 
  ADD COLUMN IF NOT EXISTS multiplier_override DECIMAL(8,2) DEFAULT NULL
  COMMENT 'NULL = usa global_multiplier. Valor = override deste jogo.';

-- Bicho
ALTER TABLE casino_bicho_config 
  ADD COLUMN IF NOT EXISTS multiplier_override DECIMAL(8,2) DEFAULT NULL
  COMMENT 'NULL = usa global_multiplier. Valor = override deste jogo.';

-- Blackjack
ALTER TABLE casino_blackjack_config 
  ADD COLUMN IF NOT EXISTS multiplier_override DECIMAL(8,2) DEFAULT NULL
  COMMENT 'NULL = usa global_multiplier. Valor = override deste jogo.';

-- ---------------------------------------------------------------------
-- 4. AJUSTAR CURVA DE MILESTONES DO DAILY-FREE
-- ---------------------------------------------------------------------
-- Pesquisa X0 F2P (01/05/2026) recomendou curva 5x ao inves de 10x.
-- GTA Online Daily Challenges usa 5x (D7=$150k -> D28=$750k).
-- Curva atual do BC era 10x (agressivo demais).
--
-- Antes:  D7=500, D14=1000, D21=2500, D28=5000  (ratio 10x)
-- Depois: D7=500, D14=1000, D21=1500, D28=2500  (ratio 5x)

UPDATE casino_daily_config
SET 
  milestone_d21 = 1500,  -- era 2500
  milestone_d28 = 2500   -- era 5000
WHERE id = 1;

-- ---------------------------------------------------------------------
-- 5. VERIFICAÇÃO (rode pra confirmar que tudo deu certo)
-- ---------------------------------------------------------------------
-- Conferir economy_config criado
SELECT 'casino_economy_config:' AS info;
SELECT * FROM casino_economy_config;

-- Conferir tabela de referencia
SELECT 'casino_economy_reference:' AS info;
SELECT * FROM casino_economy_reference ORDER BY ordem;

-- Conferir multiplier_override foi adicionado em todos
SELECT 'multiplier_override em cada tabela de jogo:' AS info;
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME = 'multiplier_override'
ORDER BY TABLE_NAME;

-- Conferir milestones do Daily-Free atualizados
SELECT 'Daily-Free milestones (deve ser D21=1500, D28=2500):' AS info;
SELECT id, milestone_d7, milestone_d14, milestone_d21, milestone_d28
FROM casino_daily_config
WHERE id = 1;

-- =====================================================================
-- FIM. Migration concluida.
--
-- Estado do banco:
--   ✅ casino_economy_config criada (multiplier global + currency)
--   ✅ casino_economy_reference criada (tabela de exemplos)
--   ✅ Todos os 4 jogos com coluna multiplier_override (NULL por default)
--   ✅ Daily-Free com curva 5x (D21=1500, D28=2500)
--
-- O que NAO mudou:
--   ✅ casino_accounts intacta
--   ✅ casino_transactions intacta
--   ✅ casino_admin_auth intacta
--   ✅ Slots/Bicho/Blackjack continuam funcionando como antes
-- =====================================================================
