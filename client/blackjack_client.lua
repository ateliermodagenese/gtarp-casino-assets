-- Blackout Casino — Blackjack Client (padrao smartphone — sem Citizen.Await)

local pendingCallbacks = {}
local callbackId = 0

local endpoints = {
  "casino:blackjack:deal",
  "casino:blackjack:hit",
  "casino:blackjack:stand",
  "casino:blackjack:double",
  "casino:blackjack:split",
  "casino:blackjack:insurance",
  "casino:blackjack:getHistory",
  "casino:blackjack:verify",
  "casino:blackjack:rotateSeed",
  "casino:blackjack:getConfig",
}

for _, endpoint in ipairs(endpoints) do
  RegisterNUICallback(endpoint, function(data, cb)
    callbackId = callbackId + 1
    local id = callbackId
    pendingCallbacks[id] = cb
    TriggerServerEvent(endpoint, id, data or {})
  end)
end

RegisterNetEvent("casino:blackjack:response")
AddEventHandler("casino:blackjack:response", function(id, resultado)
  local cb = pendingCallbacks[id]
  if cb then
    cb(resultado)
    pendingCallbacks[id] = nil
  end
end)
