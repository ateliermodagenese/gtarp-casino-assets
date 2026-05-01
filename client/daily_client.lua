-- Blackout Casino — Daily-Free Client (padrao smartphone — sem Citizen.Await)
-- Bridge entre o front Next.js (NUI) e o daily.js (server)
-- Decisoes da pesquisa X0 (29/04/2026):
--   - Anchor reward: primeiro daily-free vitalicio dispara em playerSpawned (apos load_duration)
--   - 8 endpoints proxy (state, claim, history, rotate-seed, use-makeup, verify, anchor, invalidate-config)
--   - Respeitar vRP load_duration 30s (nao disparar anchor antes)

local pendingCallbacks = {}
local callbackId = 0

-- Lista de endpoints expostos pro frontend NUI
local endpoints = {
  "casino:daily:state",
  "casino:daily:claim",
  "casino:daily:history",
  "casino:daily:rotate-seed",
  "casino:daily:use-makeup",
  "casino:daily:verify",
  "casino:daily:anchor",
  "casino:daily:invalidate-config",
}

-- Registrar todos os callbacks NUI -> ServerEvent
-- Mesmo padrao usado em bicho_client.lua / blackjack_client.lua
for _, endpoint in ipairs(endpoints) do
  RegisterNUICallback(endpoint, function(data, cb)
    callbackId = callbackId + 1
    local id = callbackId
    pendingCallbacks[id] = cb
    TriggerServerEvent(endpoint, id, data or {})
  end)
end

-- Resposta unica do server — roteia pro callback correto pelo ID
RegisterNetEvent("casino:daily:response")
AddEventHandler("casino:daily:response", function(id, resultado)
  local cb = pendingCallbacks[id]
  if cb then
    cb(resultado)
    pendingCallbacks[id] = nil
  end
end)


-- ============================================================
-- ANCHOR REWARD: notificar o front quando primeiro spawn ocorrer
-- ============================================================
-- O servidor decide se da anchor ou nao (baseado em casino_daily_streaks.anchor_claimed).
-- O client so AVISA o front que e seguro mostrar o popup de "primeiro daily-free".
-- O front entao chama casino:daily:state pra ver se anchor_claimed = false e
-- decide se mostra o popup convidando o jogador.
--
-- Respeitando vRP load_duration 30s (race condition):
-- usar Wait apos playerSpawned para garantir que vRP ja inicializou o user.

local primeiraVez = true

AddEventHandler("playerSpawned", function()
  if not primeiraVez then return end
  primeiraVez = false
  -- Aguarda 35s (vRP load_duration = 30s + buffer 5s)
  -- Garante que vRP.users[id] ja foi populado e DB esta acessivel
  Citizen.SetTimeout(35000, function()
    SendNUIMessage({
      action = "casino:daily:first_spawn_ready",
      ready = true
    })
  end)
end)


-- ============================================================
-- Helper opcional: forcar refresh do state (chamado externamente)
-- Outros sistemas (admin, eventos especiais) podem disparar este evento
-- para forcar o frontend a re-buscar o state do daily-free
-- ============================================================
RegisterNetEvent("casino:daily:refresh-state")
AddEventHandler("casino:daily:refresh-state", function()
  SendNUIMessage({ action = "casino:daily:refresh-state" })
end)
