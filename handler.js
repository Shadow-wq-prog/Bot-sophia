/*
Creador: Shadow Flash

https://chat.whatsapp.com/IyxuHbUdgvYBcVit6sThOO
*/


import ws from 'ws';
import moment from 'moment';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import gradient from 'gradient-string';
import seeCommands from './lib/system/commandLoader.js';
import initDB from './lib/system/initDB.js';
import level from './commands/level.js';
import antilink from './commands/antilink.js';
import { getGroupAdmins } from './lib/message.js';
import blacklist from './blacklist.js';

seeCommands()

const botSessionCache = new Map()
const botSessionCacheTime = new Map()
const CACHE_TTL = 30000 // 30 segundos

function updatePermissionCaches() {
  global.ownerSet = new Set(
    (global.owner || []).map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
  )
  global.modsSet = new Set(
    (global.mods || []).map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
  )
  global.maintenanceSet = new Set(
    (global.maintenanceUsers || []).map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
  )
  global.blacklistSet = new Set(
    (blacklist || []).map(n => n.replace(/\D/g, ''))
  )
}

updatePermissionCaches()

function getAllSessionBots() {
  const now = Date.now()
  const cached = botSessionCache.get('sessions')
  const cachedTime = botSessionCacheTime.get('sessions') || 0

  if (cached && (now - cachedTime) < CACHE_TTL) {
    return cached
  }

  const sessionDirs = ['./Sessions/Subs']
  let bots = []

  for (const dir of sessionDirs) {
    try {
      const subDirs = fs.readdirSync(path.resolve(dir))
      for (const sub of subDirs) {
        const credsPath = path.resolve(dir, sub, 'creds.json')
        if (fs.existsSync(credsPath)) {
          bots.push(sub + '@s.whatsapp.net')
        }
      }
    } catch {}
  }

  try {
    const ownerCreds = path.resolve('./Sessions/Owner/creds.json')
    if (fs.existsSync(ownerCreds)) {
      const ownerId = global.client?.user?.id?.split(':')[0] + '@s.whatsapp.net'
      if (ownerId) bots.push(ownerId)
    }
  } catch {}

  botSessionCache.set('sessions', bots)
  botSessionCacheTime.set('sessions', now)

  return bots
}

let lastPrefixConfig = null
let compiledPrefixRegex = null
let lastBotname = null

global.invalidatePrefixCache = () => {
  try {
    lastPrefixConfig = null
    compiledPrefixRegex = null
    lastBotname = null
  } catch {}
}

function getOrCompilePrefix(botname, prefixChars) {
  if (lastBotname === botname && lastPrefixConfig === prefixChars && compiledPrefixRegex) {
    return compiledPrefixRegex
  }
  const shortForms = [
    botname.charAt(0),
    botname.split(" ")[0],
    botname.split(" ")[0].slice(0, 2),
    botname.split(" ")[0].slice(0, 3)
  ]
  const prefixes = [botname, ...shortForms]
  const escapedChars = (prefixChars || '').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&')
  try {
    compiledPrefixRegex = new RegExp(`^(${prefixes.join('|')})?[${escapedChars}]`, 'i')
  } catch (e) {
    compiledPrefixRegex = new RegExp(`^(${prefixes.join('|')})?[\\/\\#\\.]`, 'i')
  }
  lastBotname = botname
  lastPrefixConfig = prefixChars
  return compiledPrefixRegex
}

function getTodayDate() {
  return new Date().toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/').reverse().join('-')
}

const groupMetadataCache = new Map()
const groupMetadataCacheTime = new Map()
const GROUP_CACHE_TTL = 60000 // 1 minuto

async function getCachedGroupMetadata(client, chatId) {
  const now = Date.now()
  const cached = groupMetadataCache.get(chatId)
  const cachedTime = groupMetadataCacheTime.get(chatId) || 0

  if (cached && (now - cachedTime) < GROUP_CACHE_TTL) {
    return cached
  }

  const metadata = await client.groupMetadata(chatId).catch(() => null)

  if (metadata) {
    groupMetadataCache.set(chatId, metadata)
    groupMetadataCacheTime.set(chatId, now)
  }

  return metadata
}

function isUserInAdminList(user, adminList) {
  return adminList.some(p => 
    p.phoneNumber === user || 
    p.jid === user || 
    p.id === user || 
    p.lid === user ||
    p.id?.split(':')[0] === user?.split(':')[0]
  )
}

export default async (client, m) => {
  if (!m?.message) return 

  const sender = m.sender.split(':')[0].split('@')[0] + '@s.whatsapp.net'

  let body =
    m.message.conversation ||
    m.message.extendedTextMessage?.text ||
    m.message.imageMessage?.caption ||
    m.message.videoMessage?.caption ||
    m.message.buttonsResponseMessage?.selectedButtonId ||
    m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.message.templateButtonReplyMessage?.selectedId ||
    m.message.interactiveResponseMessage?.body?.text || 
    ''

  if (/3EB0|BAE5|B24E/.test(m.id)) return

  try {
    initDB(m, client)
  } catch (e) {
    console.error(chalk.red(`[ ERROR DB/MUSICART ] →`), e)
    return 
  }

  if (!global.db?.data) return
  antilink(m, client)

  const from = m.key.remoteJid
  const selfId = client.user.id.split(':')[0] + "@s.whatsapp.net"
  const settings = global.db.data.settings[selfId] || {}

  const rawPrefijo = settings.prefijo || '#/'
  const prefas = Array.isArray(rawPrefijo) ? rawPrefijo : [rawPrefijo]
  const rawBotname = settings.namebot2 || 'Musicart'

  const isValidBotname = /^[\w\s]+$/.test(rawBotname)
  const botname2 = isValidBotname ? rawBotname : 'Musicart'

  const prefixRegex = getOrCompilePrefix(botname2, prefas.join(''))
  const prefixMatch = body.match(prefixRegex)
  const prefix = prefixMatch ? prefixMatch[0] : null

  const todayDate = getTodayDate()
  const chat = global.db.data.chats[from] || {}
  const tf = chat.users?.[m.sender] || {}

  if (tf && Object.keys(tf).length > 0) {
      if (!tf.stats) tf.stats = {}
      if (!tf.stats[todayDate]) tf.stats[todayDate] = { msgs: 0, cmds: 0 }
      tf.stats[todayDate].msgs++
      tf.lastseen = Date.now()
  }

  if (!prefix) return

  const args = body.slice(prefix.length).trim().split(/ +/)
  const command = args.shift()?.toLowerCase()
  const text = args.join(' ')

  const pushname = m.pushName || 'Sin nombre'
  const botJid = selfId

  let groupMetadata = null
  let groupAdmins = []
  let groupName = ''

  if (m.isGroup) {
    groupMetadata = await getCachedGroupMetadata(client, m.chat)
    groupName = groupMetadata?.subject || ''
    groupAdmins = groupMetadata?.participants.filter(p =>
      (p.admin === 'admin' || p.admin === 'superadmin')
    ) || []
  }

  const isBotAdmins = m.isGroup ? isUserInAdminList(botJid, groupAdmins) : false
  const isAdmins = m.isGroup ? isUserInAdminList(sender, groupAdmins) : false

  if (!chat.primaryBot || chat.primaryBot === selfId) {
    console.log(chalk.cyan(`𝄢 · • —– ٠ ✤ ٠ —– • ·✧༄
❚ ▸ 𝐁𝐎𝐓 ❱❱ ${chalk.bgMagenta(selfId)}
❚ ▸ 𝐔𝐒𝐔𝐀𝐑𝐈𝐎 ❱❱ ${chalk.white(pushname)}
❚ ▸ 𝐆𝐑𝐔𝐏𝐎 ❱❱ ${chalk.green(m.isGroup ? groupName : 'Privado')}
❚ ▸ 𝐂𝐎𝐌𝐀𝐍𝐃𝐎 ❱❱ ${chalk.yellow(prefix + command)}
𝄢 · • —– ٠ ✤ ٠ —– • ·✧༄`))
  }

  const botprimaryId = chat.primaryBot
  if (botprimaryId && botprimaryId !== selfId) {
    const botsSet = new Set(getAllSessionBots())
    if (botsSet.has(botprimaryId)) return
  }

  const isVotOwn = global.ownerSet.has(sender)

  if (settings.self) {
    if (!isVotOwn && sender !== selfId && !global.modsSet.has(sender)) return
  }

  if (!m.isGroup) {
    const allowedPrivate = ['report', 'reporte', 'sug', 'suggest', 'invite', 'help', 'menu']
    if (!isVotOwn && !allowedPrivate.includes(command)) return
  }

  if (chat.bannedGrupo && !isVotOwn) return
  if (chat.adminonly && !isAdmins) return

  if (tf.banned && !isVotOwn) {
    return m.reply(`ꕥ Has sido vetado del uso de *Musicart Wa-Bot*.\n\n✎ Si crees que ha sido un error por favor contacta al soporte.`)
  }

  const cmdData = global.comandos.get(command)
  if (!cmdData) {
    await client.readMessages([m.key]).catch(() => {})
    if (settings.prefijo === true) return
    return m.reply(`ꕤ El comando *${prefix}${command}* no existe.`)
  }

  const isModerator = global.modsSet.has(sender) || isVotOwn
  const isMaintenanceUser = global.maintenanceSet.has(sender) || isVotOwn
  const userNumber = sender.replace(/\D/g, '')

  if (global.blacklistSet.has(userNumber) && !isVotOwn) {
    return m.reply('`𑁍` Estás en la lista negra de *Musicart*.')
  }

  if (cmdData.isOwner && !isVotOwn) return m.reply(`ꕤ Solo el Owner puede usar *${prefix}${command}*.`)
  if (cmdData.isModeration && !isModerator) return m.reply(`ꕤ Solo Moderadores pueden usar *${prefix}${command}*.`)
  if (cmdData.isMaintenance && !isMaintenanceUser) return m.reply(`ꕥ El comando *${prefix}${command}* está en mantenimiento.`)
  if (cmdData.isFuture && !isMaintenanceUser) return m.reply(`ꕥ El comando *${prefix}${command}* aún no se encuentra disponible, vuelve a intentarlo en la próxima actualización.`)
  if (cmdData.isAdmin && !isAdmins) return m.reply('Necesitas ser Admin para usar ${prefix}${command}.')
  if (cmdData.botAdmin && !isBotAdmins) return m.reply('Necesito ser Admin para ejecutar ${prefix}${command}.')

  try {
    await client.readMessages([m.key]).catch(() => {})

    const userGlobal = global.db.data.users[m.sender] || {}
    userGlobal.usedcommands = (userGlobal.usedcommands || 0) + 1
    settings.commandsejecut = (settings.commandsejecut || 0) + 1
    userGlobal.exp = (userGlobal.exp || 0) + Math.floor(Math.random() * 100)
    userGlobal.name = pushname

    if (tf.stats?.[todayDate]) tf.stats[todayDate].cmds++

    await cmdData.run(client, m, args, command, text, prefix)
  } catch (error) {
    console.error(chalk.red(`[ RUN ERROR ] →`), error)
    return m.reply('🌱 Error al ejecutar el comando.')
  }

  level(m)
};