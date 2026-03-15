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
const CACHE_TTL = 30000 

function updatePermissionCaches() {
  global.ownerSet = new Set((global.owner || []).map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net'))
  global.modsSet = new Set((global.mods || []).map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net'))
  global.maintenanceSet = new Set((global.maintenanceUsers || []).map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net'))
  global.blacklistSet = new Set((blacklist || []).map(n => n.replace(/\D/g, '')))
}

updatePermissionCaches()

function getAllSessionBots() {
  const now = Date.now()
  const cached = botSessionCache.get('sessions')
  const cachedTime = botSessionCacheTime.get('sessions') || 0
  if (cached && (now - cachedTime) < CACHE_TTL) return cached

  const sessionDirs = ['./Sessions/Subs']
  let bots = []
  for (const dir of sessionDirs) {
    try {
      const subDirs = fs.readdirSync(path.resolve(dir))
      for (const sub of subDirs) {
        const credsPath = path.resolve(dir, sub, 'creds.json')
        if (fs.existsSync(credsPath)) bots.push(sub + '@s.whatsapp.net')
      }
    } catch {}
  }
  try {
    const ownerId = global.client?.user?.id?.split(':')[0] + '@s.whatsapp.net'
    if (ownerId) bots.push(ownerId)
  } catch {}
  botSessionCache.set('sessions', bots); botSessionCacheTime.set('sessions', now)
  return bots
}

let lastPrefixConfig = null; let compiledPrefixRegex = null; let lastBotname = null
global.invalidatePrefixCache = () => { lastPrefixConfig = null; compiledPrefixRegex = null; lastBotname = null }

function getOrCompilePrefix(botname, prefixChars) {
  if (lastBotname === botname && lastPrefixConfig === prefixChars && compiledPrefixRegex) return compiledPrefixRegex
  const prefixes = [botname, botname.charAt(0), botname.split(" ")[0]]
  const escapedChars = (prefixChars || '').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&')
  try { compiledPrefixRegex = new RegExp(`^(${prefixes.join('|')})?[${escapedChars}]`, 'i') } 
  catch (e) { compiledPrefixRegex = new RegExp(`^(${prefixes.join('|')})?[\\/\\#\\.]`, 'i') }
  lastBotname = botname; lastPrefixConfig = prefixChars
  return compiledPrefixRegex
}

function getTodayDate() {
  return new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
}

const groupMetadataCache = new Map(); const GROUP_CACHE_TTL = 60000 
async function getCachedGroupMetadata(client, chatId) {
  const now = Date.now()
  if (groupMetadataCache.has(chatId) && (now - (groupMetadataCache.get(chatId).time || 0)) < GROUP_CACHE_TTL) return groupMetadataCache.get(chatId).data
  const metadata = await client.groupMetadata(chatId).catch(() => null)
  if (metadata) groupMetadataCache.set(chatId, { data: metadata, time: now })
  return metadata
}

function isUserInAdminList(user, adminList) {
  return adminList.some(p => p.id?.split(':')[0] === user?.split(':')[0])
}

export default async (client, m) => {
  if (!m?.message) return 
  const sender = m.sender.split(':')[0] + '@s.whatsapp.net'

  let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply?.selectedRowId || m.message.templateButtonReplyMessage?.selectedId || m.message.interactiveResponseMessage?.body?.text || ''

  if (/3EB0|BAE5|B24E/.test(m.id)) return

  try { initDB(m, client) } catch (e) { return }
  if (!global.db?.data) return
  antilink(m, client)

  const from = m.key.remoteJid
  const selfId = client.user.id.split(':')[0] + "@s.whatsapp.net"
  const settings = global.db.data.settings[selfId] || {}
  const rawPrefijo = settings.prefijo || '#/'
  const prefas = Array.isArray(rawPrefijo) ? rawPrefijo : [rawPrefijo]
  const botname2 = settings.namebot2 || 'Musicart'

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

  // --- CORRECCIÓN DE ARGUMENTOS ---
  const args = body.slice(prefix.length).trim().split(/ +/)
  const command = args.shift()?.toLowerCase()
  const text = args.join(' ')
  // --------------------------------

  const cmdData = global.comandos.get(command) || [...global.comandos.values()].find(c => c.alias && c.alias.includes(command))
  
  if (!cmdData) {
    if (settings.prefijo === true) return
    return m.reply(`ꕤ El comando *${prefix}${command}* no existe.`)
  }

  const pushname = m.pushName || 'Sin nombre'
  let groupMetadata = m.isGroup ? await getCachedGroupMetadata(client, m.chat) : null
  let groupAdmins = groupMetadata?.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin') || []
  const isBotAdmins = m.isGroup ? isUserInAdminList(selfId, groupAdmins) : false
  const isAdmins = m.isGroup ? isUserInAdminList(sender, groupAdmins) : false
  const isVotOwn = global.ownerSet.has(sender)

  // Registro en consola
  console.log(chalk.cyan(`𝄢 · • —– ٠ ✤ ٠ —– • ·✧༄\n❚ ▸ 𝐁𝐎𝐓 ❱❱ ${selfId}\n❚ ▸ 𝐔𝐒𝐔𝐀𝐑𝐈𝐎 ❱❱ ${pushname}\n❚ ▸ 𝐂𝐎𝐌𝐀𝐍𝐃𝐎 ❱❱ ${prefix + command}\n𝄢 · • —– ٠ ✤ ٠ —– • ·✧༄`))

  // Validaciones de seguridad
  if (chat.bannedGrupo && !isVotOwn) return
  if (tf.banned && !isVotOwn) return m.reply(`ꕥ Has sido vetado.`)
  if (cmdData.isOwner && !isVotOwn) return m.reply(`ꕤ Solo el Owner puede usar esto.`)
  if (cmdData.isAdmin && !isAdmins) return m.reply('Necesitas ser Admin.')
  if (cmdData.botAdmin && !isBotAdmins) return m.reply('Necesito ser Admin.')

  try {
    const userGlobal = global.db.data.users[m.sender] || {}
    userGlobal.usedcommands = (userGlobal.usedcommands || 0) + 1
    userGlobal.exp = (userGlobal.exp || 0) + Math.floor(Math.random() * 100)
    if (tf.stats?.[todayDate]) tf.stats[todayDate].cmds++

    // --- EJECUCIÓN CON OBJETO (PARA COMPATIBILIDAD) ---
    await cmdData.run(client, m, { 
        args, 
        text, 
        command, 
        prefix, 
        groupMetadata,
        isAdmins,
        isBotAdmins
    })
    // --------------------------------------------------

  } catch (error) {
    console.error(chalk.red(`[ RUN ERROR ] →`), error)
    return m.reply('🌱 Error al ejecutar el comando.')
  }
  level(m)
};
