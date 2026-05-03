-- Blackout Casino — Panel Client (padrao smartphone — sem Citizen.Await)

local painelAberto = false
local pendingCallbacks = {}
local callbackId = 0

function AbrirPainelCassino()
  if painelAberto then return end
  painelAberto = true
  SetNuiFocus(true, true)
  SendNUIMessage({ action = "show" })
end

function FecharPainelCassino()
  if not painelAberto then return end
  painelAberto = false
  SetNuiFocus(false, false)
  SendNUIMessage({ action = "hide" })
end

RegisterCommand("cassino", function() AbrirPainelCassino() end, false)
RegisterKeyMapping("cassino", "Abrir Blackout Casino", "keyboard", "F5")

RegisterNUICallback("casino:panel:close", function(_, cb)
  FecharPainelCassino()
  cb({ ok = true })
end)

-- Proxy generico: React envia qualquer evento, Lua roteia pro server com ID
RegisterNUICallback("casino:panel:getSaldo", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:panel:getSaldo", id)
end)

RegisterNUICallback("casino:panel:buyGCoin", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:panel:buyGCoin", id, data and tonumber(data.amount) or 0)
end)

RegisterNUICallback("casino:panel:cashoutGCoin", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:panel:cashoutGCoin", id, data and tonumber(data.amount) or 0)
end)

RegisterNUICallback("casino:panel:getHistory", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:panel:getHistory", id, data and data.limite or 50)
end)

RegisterNUICallback("casino:panel:getConfig", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:panel:getConfig", id)
end)

RegisterNUICallback("casino:panel:getWalletBalance", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:panel:getWalletBalance", id)
end)

RegisterNUICallback("casino:panel:getHistoryFiltered", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:panel:getHistoryFiltered", id, data)
end)

-- Admin panel callbacks
RegisterNUICallback("casino:admin:auth", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:admin:auth", id, data)
end)

RegisterNUICallback("casino:admin:setup", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:admin:setup", id, data)
end)

RegisterNUICallback("casino:admin:getConfig", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:admin:getConfig", id, data)
end)

RegisterNUICallback("casino:admin:setConfig", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:admin:setConfig", id, data)
end)

RegisterNUICallback("casino:admin:changePassword", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:admin:changePassword", id, data)
end)

-- Economy endpoints (admin autenticado)
RegisterNUICallback("casino:admin:getConfigWithEconomy", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:admin:getConfigWithEconomy", id, data)
end)

RegisterNUICallback("casino:admin:setConfigWithEconomy", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:admin:setConfigWithEconomy", id, data)
end)

-- Economy config publico (jogos usam sem auth)
RegisterNUICallback("casino:economy:getConfig", function(data, cb)
  callbackId = callbackId + 1
  local id = callbackId
  pendingCallbacks[id] = cb
  TriggerServerEvent("casino:economy:getConfig", id, data)
end)

-- Resposta unica do server — roteia pro callback correto pelo ID
RegisterNetEvent("casino:panel:response")
AddEventHandler("casino:panel:response", function(id, resultado)
  local cb = pendingCallbacks[id]
  if cb then
    cb(resultado)
    pendingCallbacks[id] = nil
  end
end)
