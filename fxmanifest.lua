fx_version 'cerulean'
game 'gta5'

author 'BC - Agencia Solucoes Digitais'
description 'Blackout Casino - 22 jogos para GTA RP'
version '1.0.0'

dependencies {
    'oxmysql',
    'vrp',
}

ui_page 'index.html'

files {
    'index.html',
    '_next/**/*',
    'assets/**/*',
}

client_scripts {
    'client/panel_client.lua',
    'client/slots_client.lua',
    'client/blackjack_client.lua',
    'client/bicho_client.lua',
    'client/daily_client.lua',
    'client/diagnostico.lua',
}

server_scripts {
    '@vrp/lib/utils.lua',
    'server/vrp_bridge.lua',
    'server/handlers/panel.js',
    'server/handlers/slots.js',
    'server/handlers/blackjack.js',
    'server/handlers/bicho.js',
    'server/handlers/daily.js',
    'server/handlers/diagnostico.js',
    'server/handlers/admin.js',
}