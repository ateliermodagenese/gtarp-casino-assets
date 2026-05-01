-- =====================================================================
-- MIGRATION: Adicionar test_mode em casino_daily_config
-- 30/04/2026 - Blackout Casino Daily-Free (#19)
-- =====================================================================
-- Permite bypass do cooldown 24h durante testes do admin.
-- Quando test_mode = 1: jogador pode girar a roda quantas vezes quiser
--                      (claim ainda registra normal no DB, streak ainda
--                      avanca, milestones disparam, history grava).
-- Quando test_mode = 0: comportamento normal (cooldown 24h ativo).
--
-- Compativel com banco que ja tem o schema rodando.
-- A clausula IF NOT EXISTS evita erro caso ja tenha sido aplicada.
-- =====================================================================

ALTER TABLE casino_daily_config
  ADD COLUMN IF NOT EXISTS test_mode TINYINT(1) NOT NULL DEFAULT 0
  COMMENT 'Modo teste: 1=bypassa cooldown 24h. Default 0=normal.'
  AFTER enabled;

-- Garante que a linha id=1 (singleton) tenha o valor default
-- caso o banco ja exista mas ainda nao tenha test_mode no insert
UPDATE casino_daily_config
SET test_mode = COALESCE(test_mode, 0)
WHERE id = 1;

-- =====================================================================
-- Como ativar via admin (SQL direto OU painel admin):
--
-- Via SQL:
--   UPDATE casino_daily_config SET test_mode = 1 WHERE id = 1;
--
-- Via admin panel:
--   casino:admin:setConfig com payload.changes = { test_mode: "1" }
--
-- Para desligar:
--   UPDATE casino_daily_config SET test_mode = 0 WHERE id = 1;
-- =====================================================================
