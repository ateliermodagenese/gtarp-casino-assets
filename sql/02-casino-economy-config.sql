-- ============================================================
-- TABELA: casino_economy_config
-- Sistema de multiplier de economia — Blackout Casino
-- Data: 01/05/2026
-- 
-- COMO FUNCIONA:
-- Todos os valores do casino (premios, apostas, milestones)
-- sao valores BASE fixos no codigo/SQL.
-- O backend multiplica BASE * multiplier pra gerar o valor real.
-- O admin ajusta UM numero (global_multiplier) pra escalar tudo.
-- Se quiser ajustar um jogo especifico, usa multiplier_override
-- na tabela de config do jogo (ex: casino_daily_config).
--
-- FORMULA SUGERIDA:
--   global_multiplier = salario_medio_hora_servidor / 10000
--   Servidor medio (10k/h): 1.0x
--   Servidor low (1k/h): 0.1x
--   Servidor high (100k/h): 10.0x
-- ============================================================

CREATE TABLE IF NOT EXISTS casino_economy_config (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  
  -- Multiplier global (aplica em todos os jogos que nao tem override)
  global_multiplier DECIMAL(10,4) NOT NULL DEFAULT 1.0000
    COMMENT 'Multiplica todos os valores BASE do casino. Formula: salario/h / 10000',
  
  -- Moeda do servidor (aparece em todos os jogos)
  currency_name VARCHAR(40) NOT NULL DEFAULT 'GCoin'
    COMMENT 'Nome da moeda exibido nos jogos',
  currency_symbol VARCHAR(8) NOT NULL DEFAULT 'GC'
    COMMENT 'Simbolo curto (aparece ao lado dos valores)',
  currency_icon VARCHAR(255) NOT NULL DEFAULT '/assets/shared/icons/icon-gcoin.png'
    COMMENT 'Caminho do icone PNG da moeda',
  
  -- Audit
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(64) DEFAULT NULL
    COMMENT 'Identifier de quem alterou (admin)'
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Configuracao economica global do casino — multiplier + moeda';

-- Seed com valor default (multiplier 1.0 = servidor medio)
INSERT INTO casino_economy_config (id, global_multiplier, currency_name, currency_symbol)
VALUES (1, 1.0000, 'GCoin', 'GC')
ON DUPLICATE KEY UPDATE id = id;

-- ============================================================
-- Adicionar multiplier_override na tabela daily config
-- (repetir pra cada jogo quando criar: slots, bicho, blackjack, crash)
-- ============================================================

-- Daily-Free
ALTER TABLE casino_daily_config
  ADD COLUMN IF NOT EXISTS multiplier_override DECIMAL(10,4) DEFAULT NULL
  COMMENT 'NULL = usa global_multiplier. Valor = override deste jogo';

-- Slots (se tabela existir)
-- ALTER TABLE casino_slots_config
--   ADD COLUMN IF NOT EXISTS multiplier_override DECIMAL(10,4) DEFAULT NULL;

-- Bicho (se tabela existir)  
-- ALTER TABLE casino_bicho_config
--   ADD COLUMN IF NOT EXISTS multiplier_override DECIMAL(10,4) DEFAULT NULL;

-- Blackjack (se tabela existir)
-- ALTER TABLE casino_blackjack_config
--   ADD COLUMN IF NOT EXISTS multiplier_override DECIMAL(10,4) DEFAULT NULL;
