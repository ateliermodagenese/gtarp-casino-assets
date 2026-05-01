-- Blackout Casino - Daily-Free (#19) - Schema MySQL
-- Compativel com MariaDB 10.6+ e MySQL 8.0+
-- Usar com oxmysql (prepared statements, ? placeholders)
-- Executar APOS panel.sql (depende de casino_accounts)
--
-- Decisoes da pesquisa X0 ampliada (29/04/2026):
--   - 12 segments na roleta + 1 Mystery wedge
--   - Ciclo de 28 dias com 4 milestones (D7, D14, D21, D28)
--   - 24h-rolling timer (NAO 0h fixo) - last_claim_at + 24h
--   - 3 Make-Up Tokens por mes (Genshin model)
--   - Tier VIP: 2x spins/dia (modelo GTA+/Diamond Casino)
--   - Streak persiste entre Seasons (ouro nao persiste)
--   - HMAC-SHA256 (compativel com lib/crypto.ts existente)
--   - Discord webhook para milestones e big wins
-- =====================================================================


-- =====================================================================
-- 1. CONFIG do Daily-Free (admin ajusta sem restart)
-- =====================================================================
-- Padrao de 1 unica linha (id=1) similar ao casino_bicho_config
-- Todos os parametros editaveis pelo admin via painel
CREATE TABLE IF NOT EXISTS casino_daily_config (
    id INT PRIMARY KEY DEFAULT 1,

    -- Mecanica geral
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    cycle_days INT NOT NULL DEFAULT 28,
    cooldown_hours INT NOT NULL DEFAULT 24,
    grace_period_minutes INT NOT NULL DEFAULT 120,

    -- Spins por dia
    spins_per_day_free INT NOT NULL DEFAULT 1,
    spins_per_day_vip INT NOT NULL DEFAULT 2,

    -- Make-Up Tokens (Genshin model)
    makeup_tokens_per_month INT NOT NULL DEFAULT 3,
    makeup_tokens_enabled TINYINT(1) NOT NULL DEFAULT 1,

    -- Premios da roleta (12 segments + 1 Mystery)
    -- Distribuicao base, valores em GCoin
    -- Cada segment tem: valor_min, valor_max, peso (probabilidade relativa)
    -- JSON facilita admin editar sem ALTER TABLE
    wheel_segments JSON NOT NULL,

    -- Bonus de milestones (4 milestones)
    milestone_d7 INT NOT NULL DEFAULT 500,
    milestone_d14 INT NOT NULL DEFAULT 1000,
    milestone_d21 INT NOT NULL DEFAULT 2500,
    milestone_d28 INT NOT NULL DEFAULT 5000,

    -- Anti-abuse
    max_payout_per_spin INT NOT NULL DEFAULT 10000,
    rate_limit_seconds INT NOT NULL DEFAULT 5,

    -- Discord webhook
    discord_webhook_enabled TINYINT(1) NOT NULL DEFAULT 0,
    discord_webhook_url VARCHAR(255) DEFAULT NULL,
    discord_min_payout_announce INT NOT NULL DEFAULT 1000,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed inicial (so insere se nao existe)
-- Distribuicao das 12 fatias + 1 Mystery (total weight = 100):
--   Comum (50-100 GC):    8 segments x peso 8 = 64% chance combinada
--   Bom (200-500 GC):     2 segments x peso 12 = 24% chance combinada
--   Grande (1000 GC):     1 segment x peso 8 = 8% chance
--   Mystery (1000-5000):  1 segment x peso 4 = 4% chance
INSERT IGNORE INTO casino_daily_config (id, wheel_segments) VALUES (1, JSON_ARRAY(
    JSON_OBJECT('id', 1,  'tier', 'common',  'min', 50,   'max', 50,   'weight', 8,  'icon', 'coin-small'),
    JSON_OBJECT('id', 2,  'tier', 'common',  'min', 100,  'max', 100,  'weight', 8,  'icon', 'coin-small'),
    JSON_OBJECT('id', 3,  'tier', 'common',  'min', 50,   'max', 50,   'weight', 8,  'icon', 'coin-small'),
    JSON_OBJECT('id', 4,  'tier', 'good',    'min', 200,  'max', 200,  'weight', 12, 'icon', 'coin-medium'),
    JSON_OBJECT('id', 5,  'tier', 'common',  'min', 100,  'max', 100,  'weight', 8,  'icon', 'coin-small'),
    JSON_OBJECT('id', 6,  'tier', 'common',  'min', 50,   'max', 50,   'weight', 8,  'icon', 'coin-small'),
    JSON_OBJECT('id', 7,  'tier', 'good',    'min', 500,  'max', 500,  'weight', 12, 'icon', 'coin-medium'),
    JSON_OBJECT('id', 8,  'tier', 'common',  'min', 100,  'max', 100,  'weight', 8,  'icon', 'coin-small'),
    JSON_OBJECT('id', 9,  'tier', 'big',     'min', 1000, 'max', 1000, 'weight', 8,  'icon', 'coin-stack'),
    JSON_OBJECT('id', 10, 'tier', 'common',  'min', 50,   'max', 50,   'weight', 8,  'icon', 'coin-small'),
    JSON_OBJECT('id', 11, 'tier', 'common',  'min', 100,  'max', 100,  'weight', 8,  'icon', 'coin-small'),
    JSON_OBJECT('id', 12, 'tier', 'mystery', 'min', 1000, 'max', 5000, 'weight', 4,  'icon', 'treasure')
));


-- =====================================================================
-- 2. STREAKS - estado atual de cada jogador
-- =====================================================================
-- 1 linha por jogador (UNIQUE em identifier)
-- Atualizada a cada claim
CREATE TABLE IF NOT EXISTS casino_daily_streaks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(64) NOT NULL UNIQUE,

    -- Streak atual e historico
    current_streak INT NOT NULL DEFAULT 0,
    longest_streak INT NOT NULL DEFAULT 0,
    total_claims INT NOT NULL DEFAULT 0,
    total_gcoin_earned BIGINT NOT NULL DEFAULT 0,

    -- Ultimo claim (para calcular cooldown 24h-rolling)
    last_claim_at TIMESTAMP NULL DEFAULT NULL,
    last_claim_segment_id INT DEFAULT NULL,

    -- Ciclo atual (1 a 28)
    current_cycle_day INT NOT NULL DEFAULT 0,
    cycle_started_at TIMESTAMP NULL DEFAULT NULL,
    cycles_completed INT NOT NULL DEFAULT 0,

    -- Make-Up Tokens (Genshin model)
    makeup_tokens_remaining INT NOT NULL DEFAULT 3,
    makeup_tokens_month VARCHAR(7) DEFAULT NULL, -- formato '2026-04'

    -- Anchor reward (primeiro daily-free vitalicio - vRP first_spawn)
    anchor_claimed TINYINT(1) NOT NULL DEFAULT 0,
    anchor_claimed_at TIMESTAMP NULL DEFAULT NULL,

    -- Season tracking (Cidade Alta tem ciclos de Season)
    -- streak persiste entre Seasons, ouro nao persiste
    season_id VARCHAR(40) DEFAULT NULL,

    -- Provably Fair: nonce sequencial por jogador
    nonce INT UNSIGNED NOT NULL DEFAULT 0,
    server_seed VARCHAR(64) DEFAULT NULL,
    server_seed_hash VARCHAR(64) DEFAULT NULL,
    client_seed VARCHAR(64) DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_streak (current_streak DESC),
    INDEX idx_last_claim (last_claim_at),
    INDEX idx_season (season_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 3. CLAIMS - historico completo de cada giro (audit log + Provably Fair)
-- =====================================================================
-- 1 linha por giro
-- Permite Provably Fair verificavel + analytics + cohort analysis
CREATE TABLE IF NOT EXISTS casino_daily_claims (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(64) NOT NULL,

    -- Tipo de claim
    claim_type ENUM('regular','vip','makeup','anchor') NOT NULL DEFAULT 'regular',

    -- Streak no momento do claim (snapshot)
    streak_at_claim INT NOT NULL DEFAULT 1,
    cycle_day_at_claim INT NOT NULL DEFAULT 1,

    -- Resultado da roleta
    wheel_segment_id INT NOT NULL,
    wheel_segment_tier VARCHAR(16) NOT NULL,
    wheel_amount INT NOT NULL DEFAULT 0,

    -- Mystery wedge: valor sorteado dentro do range
    mystery_amount INT DEFAULT NULL,

    -- Bonus de milestone (se aplicavel - so vem em D7/D14/D21/D28)
    milestone_day INT DEFAULT NULL,
    milestone_bonus INT NOT NULL DEFAULT 0,

    -- Total efetivamente creditado (wheel + milestone + mystery extra)
    total_awarded INT NOT NULL DEFAULT 0,

    -- Provably Fair (auditavel)
    server_seed VARCHAR(64) NOT NULL,
    server_seed_hash VARCHAR(64) NOT NULL,
    client_seed VARCHAR(64) NOT NULL,
    nonce INT UNSIGNED NOT NULL,
    result_hash VARCHAR(64) NOT NULL,
    result_float DECIMAL(20,18) NOT NULL,

    -- Anti-abuse
    ip_hash VARCHAR(64) DEFAULT NULL,
    char_id INT DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_identifier (identifier),
    INDEX idx_created (created_at),
    INDEX idx_segment (wheel_segment_id),
    INDEX idx_milestone (milestone_day),
    INDEX idx_total_desc (total_awarded DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 4. AUDIT - eventos importantes (admin actions, anti-fraude, etc.)
-- =====================================================================
CREATE TABLE IF NOT EXISTS casino_daily_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(64) DEFAULT NULL,
    action VARCHAR(32) NOT NULL,
    -- actions possiveis:
    --   'claim_attempt_blocked' - cooldown ainda ativo
    --   'streak_reset' - perdeu o streak
    --   'streak_recovered' - usou makeup token
    --   'milestone_reached' - alcancou D7/D14/D21/D28
    --   'mystery_landed' - caiu no Mystery wedge
    --   'admin_config_change' - admin editou config
    --   'discord_webhook_sent' - webhook enviado
    --   'rate_limit_hit' - jogador excedeu rate limit
    claim_id BIGINT UNSIGNED DEFAULT NULL,
    details JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_identifier_action (identifier, action),
    INDEX idx_action_created (action, created_at),
    INDEX idx_claim (claim_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 5. SERVER SEEDS POOL - rotacao de seeds (commit-reveal scheme)
-- =====================================================================
-- Quando jogador rotaciona o client_seed, o server_seed antigo e revelado
-- Esta tabela mantem historico para auditoria
CREATE TABLE IF NOT EXISTS casino_daily_seeds_archive (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(64) NOT NULL,
    server_seed VARCHAR(64) NOT NULL,
    server_seed_hash VARCHAR(64) NOT NULL,
    client_seed VARCHAR(64) NOT NULL,
    nonce_start INT UNSIGNED NOT NULL DEFAULT 0,
    nonce_end INT UNSIGNED NOT NULL DEFAULT 0,
    revealed TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revealed_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_identifier (identifier),
    INDEX idx_revealed (revealed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- QUERIES ADMIN UTEIS (NAO executar, somente referencia)
-- =====================================================================
-- Top 10 streaks atuais:
--   SELECT identifier, current_streak, longest_streak FROM casino_daily_streaks
--   ORDER BY current_streak DESC LIMIT 10;
--
-- Total distribuido em 30 dias:
--   SELECT SUM(total_awarded) FROM casino_daily_claims
--   WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
--
-- Distribuicao por tier (verificar se RTP esta proximo do esperado):
--   SELECT wheel_segment_tier, COUNT(*) as count, AVG(wheel_amount) as avg
--   FROM casino_daily_claims GROUP BY wheel_segment_tier;
--
-- Cohort analysis - retencao por install date:
--   SELECT DATE(MIN(created_at)) as cohort, COUNT(DISTINCT identifier) as players
--   FROM casino_daily_claims GROUP BY identifier
--   ORDER BY cohort;
--
-- Make-Up Tokens uso por mes:
--   SELECT makeup_tokens_month, COUNT(*) FROM casino_daily_streaks
--   WHERE makeup_tokens_remaining < 3 GROUP BY makeup_tokens_month;
--
-- Mystery hits do mes:
--   SELECT identifier, mystery_amount, created_at FROM casino_daily_claims
--   WHERE wheel_segment_tier = 'mystery' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
--   ORDER BY mystery_amount DESC;

-- =====================================================================
-- FIM DO SCHEMA
-- =====================================================================
