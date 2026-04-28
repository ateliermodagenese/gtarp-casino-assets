-- Blackout Casino - Blackjack (#4) - Schema MySQL
-- Compativel com MariaDB 10.3+ e MySQL 5.7+
-- Usar com oxmysql (prepared statements)
-- Executar APOS panel.sql (depende de casino_accounts)

-- Config do Blackjack (admin ajusta sem restart)
CREATE TABLE IF NOT EXISTS casino_blackjack_config (
    id INT PRIMARY KEY DEFAULT 1,
    decks INT NOT NULL DEFAULT 6,
    dealer_stands_on INT NOT NULL DEFAULT 17,
    blackjack_payout_num INT NOT NULL DEFAULT 3,
    blackjack_payout_den INT NOT NULL DEFAULT 2,
    insurance_payout_num INT NOT NULL DEFAULT 2,
    insurance_payout_den INT NOT NULL DEFAULT 1,
    max_splits INT NOT NULL DEFAULT 3,
    bet_min INT NOT NULL DEFAULT 10,
    bet_max INT NOT NULL DEFAULT 100000,
    side_bet_min INT NOT NULL DEFAULT 10,
    side_bet_max INT NOT NULL DEFAULT 10000,
    insurance_timer_seconds INT NOT NULL DEFAULT 10,
    cooldown_ms INT NOT NULL DEFAULT 2000,
    max_rounds_per_hour INT NOT NULL DEFAULT 120,
    max_payout INT NOT NULL DEFAULT 5000000,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO casino_blackjack_config (id) VALUES (1);


-- Maos jogadas (historico completo de cada rodada)
CREATE TABLE IF NOT EXISTS casino_blackjack_hands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(64) NOT NULL,
    round_id VARCHAR(36) NOT NULL,
    main_bet INT NOT NULL,
    player_cards JSON NOT NULL,
    dealer_cards JSON NOT NULL,
    player_total INT NOT NULL DEFAULT 0,
    dealer_total INT NOT NULL DEFAULT 0,
    result_type VARCHAR(16) NOT NULL,
    payout INT NOT NULL DEFAULT 0,
    net_change INT NOT NULL DEFAULT 0,
    is_doubled TINYINT(1) NOT NULL DEFAULT 0,
    is_from_split TINYINT(1) NOT NULL DEFAULT 0,
    hand_index INT NOT NULL DEFAULT 0,
    server_seed VARCHAR(64) NOT NULL,
    server_seed_hash VARCHAR(64) NOT NULL,
    client_seed VARCHAR(64) NOT NULL,
    nonce INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bj_hands_identifier (identifier),
    INDEX idx_bj_hands_round (round_id),
    INDEX idx_bj_hands_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Side bets (PP e 21+3, vinculadas a uma mao)
CREATE TABLE IF NOT EXISTS casino_blackjack_side_bets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hand_id INT NOT NULL,
    identifier VARCHAR(64) NOT NULL,
    type VARCHAR(8) NOT NULL,
    amount INT NOT NULL,
    result VARCHAR(32) DEFAULT NULL,
    multiplier DECIMAL(8,2) DEFAULT NULL,
    payout INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hand_id) REFERENCES casino_blackjack_hands(id) ON DELETE CASCADE,
    INDEX idx_bj_sb_hand (hand_id),
    INDEX idx_bj_sb_identifier (identifier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Sessoes PF (seed pairs por jogador)
CREATE TABLE IF NOT EXISTS casino_blackjack_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(64) NOT NULL,
    server_seed VARCHAR(64) NOT NULL,
    server_seed_hash VARCHAR(64) NOT NULL,
    client_seed VARCHAR(64) NOT NULL,
    nonce INT NOT NULL DEFAULT 0,
    revealed TINYINT(1) NOT NULL DEFAULT 0,
    revealed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bj_sessions_identifier (identifier),
    INDEX idx_bj_sessions_active (identifier, revealed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Audit log (admin: quem fez o que quando)
CREATE TABLE IF NOT EXISTS casino_blackjack_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    details JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bj_audit_identifier (identifier),
    INDEX idx_bj_audit_action (action),
    INDEX idx_bj_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
