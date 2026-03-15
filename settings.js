import fs from 'fs';
import chalk from 'chalk';

// ———————————————————————————————————————————————————————————————————
// CONFIGURACIÓN DE DUEÑOS Y PREFIJO
// ———————————————————————————————————————————————————————————————————
global.owner = [  
  ['51983564381', 'Shadow Flash', true],
  ['5491140642242', 'Owner 2', true],
  ['584228028583', 'Owner 3', true]
]

global.prefix = '√' // <--- TU NUEVO PREFIJO ESTABLECIDO

global.maintenanceUsers = [] 
global.mods = []

// ———————————————————————————————————————————————————————————————————
// INFO DEL BOT
// ———————————————————————————————————————————————————————————————————
global.sessionName = 'Sessions/Owner'
global.version = 'V1.0|Alphaᵖªᵗᶜʰ'
global.internalVersion = 'V1.0.0/51'
global.pairing_code = true
global.number_bot = ''
global.msgglobal = '[Error: *TypeError*] fetch failed'
globalThis.dev = '❀ 𝙿𝚘𝚠𝚎𝚛𝚎𝚍 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗 ❀'

// ———————————————————————————————————————————————————————————————————
// APIS Y CONEXIONES (EvoGB Activa)
// ———————————————————————————————————————————————————————————————————
global.api = {
  url: 'https://api.evogb.org',
  key: 'evogb-dR7kpt3M'
}

global.bot = {
  api: 'https://api.stellarwa.xyz',
  web: 'https://whatsapp.com/channel/0029VaAN15BJP21BYCJ3tH04'
}

global.mess = {
  socket: '《✧》 Este comando solo puede ser ejecutado por un Socket.',
  admin: '《✧》 Este comando solo puede ser ejecutado por los Administradores del Grupo.',
  botAdmin: '《✧》 Este comando solo puede ser ejecutado si el Socket es Administrador del Grupo.'
}

global.APIs = {
  adonix: { url: "https://api-adonix.ultraplus.click", key: "Destroy" },
  vreden: { url: "https://api.vreden.web.id", key: null },
  nekolabs: { url: "https://api.nekolabs.web.id", key: null },
  siputzx: { url: "https://api.siputzx.my.id", key: null },
  delirius: { url: "https://api.delirius.store", key: null },
  ootaizumi: { url: "https://api.ootaizumi.web.id", key: null },
  stellar: { url: "https://api.stellarwa.xyz", key: "Yuki-WaBot" },
  apifaa: { url: "https://api-faa.my.id", key: null },
  xyro: { url: "https://api.xyro.site", key: null },
  yupra: { url: "https://api.yupra.my.id", key: null },
}
