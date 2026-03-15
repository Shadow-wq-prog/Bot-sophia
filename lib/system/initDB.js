let isNumber = (x) => typeof x === 'number' && !isNaN(x)

function initDB(m, client) {
  const jid = client.user.id.split(':')[0] + '@s.whatsapp.net'

  const settings = global.db.data.settings[jid] ||= {}
  settings.self ??= false
  settings.prefijo ??= ['¥']
  settings.id ??= '120363198641161536@newsletter'
  settings.nameid ??= '亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗'
  settings.link ??= 'https://api.stellarwa.xyz'
  settings.banner ??= ''
  settings.icon ??= ''
  settings.currency ??= 'Coins'
  settings.namebot ??= 'Ɗҽʂƚιɳყ'
  settings.namebot2 ??= 'Cσʂҽƚƚҽ Sƈԋɳҽιԃҽɾ'
  settings.namebot3 ??= '『Mυʂιƈαɾƚ ɯα Ⴆσƚ』'
/*
  settings.namebot ??= 'Mαʂԋα'
  settings.namebot2 ??= '『Mαʂԋα ɯα Ⴆσƚ』'
  settings.namebot3 ??= '『Mαʂԋα ɯα Ⴆσƚ』'
*/
  settings.owner ??= '@亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗'

  const user = global.db.data.users[m.sender] ||= {}
  user.name ??= m.pushName || ''
  user.exp = isNumber(user.exp) ? user.exp : 0
  user.level = isNumber(user.level) ? user.level : 0
  user.coins = isNumber(user.coins) ? user.coins : 0
  user.bank = isNumber(user.bank) ? user.bank : 0

  user.inventory = Array.isArray(user.inventory) ? user.inventory : []
  user.characters = Array.isArray(user.characters) ? user.characters : []
  user.rwCooldown = isNumber(user.rwCooldown) ? user.rwCooldown : 0

  user.vip = isNumber(user.vip) ? user.vip : 0
  user.superVip = isNumber(user.superVip) ? user.superVip : 0
  user.ultraVip = isNumber(user.ultraVip) ? user.ultraVip : 0
  user.ownerVip = isNumber(user.ownerVip) ? user.ownerVip : 0
  user.lastWeekly = isNumber(user.lastWeekly) ? user.lastWeekly : 0
  user.weeklyStreak = isNumber(user.weeklyStreak) ? user.weeklyStreak : 0
  user.usedcommands = isNumber(user.usedcommands) ? user.usedcommands : 0
  user.pasatiempo ??= ''
  user.description ??= ''
  user.marry ??= ''
  user.genre ??= ''
  user.birth ??= ''
  user.metadatos ??= null
  user.metadatos2 ??= null

  const chat = global.db.data.chats[m.chat] ||= {}
  chat.users ||= {}
  chat.bannedGrupo ??= false
  chat.welcome ??= false
  chat.nsfw ??= false
  chat.alerts ??= false
  chat.gacha ??= true
  chat.rpg ??= true
  chat.adminonly ??= false
  chat.primaryBot ??= null
  chat.antilinks ??= true
  chat.personajesReservados ||= []

  chat.users[m.sender] ||= {}
  chat.users[m.sender].bank = isNumber(chat.users[m.sender].bank) ? chat.users[m.sender].bank : 0
  chat.users[m.sender].dailyStreak = isNumber(chat.users[m.sender].dailyStreak) ? chat.users[m.sender].dailyStreak : 0

  global.db.data.gachaVotes = global.db.data.gachaVotes || {};
  global.db.data.gachaCooldowns = global.db.data.gachaCooldowns || {};
} 

export default initDB;