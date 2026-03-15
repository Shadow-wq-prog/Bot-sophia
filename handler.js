/*
Creador: Shadow Flash
Versión: Musicart + Anti-Errores (Híbrido Definitivo)
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

// Inicializar Comandos
seeCommands();

const botSessionCache = new Map();
const botSessionCacheTime = new Map();
const CACHE_TTL = 30000; 

// --- CACHÉ DE PERMISOS ---
function updatePermissionCaches() {
  global.ownerSet = new Set((global.owner || []).map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net'));
  global.modsSet = new Set((global.mods || []).map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net'));
  global.maintenanceSet = new Set((global.maintenanceUsers || []).map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net'));
  global.blacklistSet = new Set((blacklist || []).map(n => n.replace(/\D/g, '')));
}
updatePermissionCaches();

// --- GESTIÓN DE PREFIJOS DINÁMICOS ---
let lastPrefixConfig = null; let compiledPrefixRegex = null; let lastBotname = null;
function getOrCompilePrefix(botname, prefixChars) {
  if (lastBotname === botname && lastPrefixConfig === prefixChars && compiledPrefixRegex) return compiledPrefixRegex;
  const prefixes = [botname, botname.charAt(0), botname.split(" ")[0]];
  const escapedChars = (prefixChars || '').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&');
  try { compiledPrefixRegex = new RegExp(`^(${prefixes.join('|')})?[${escapedChars}]`, 'i'); } 
  catch (e) { compiledPrefixRegex = new RegExp(`^(${prefixes.join('|')})?[\\/\\#\\.]`, 'i'); }
  lastBotname = botname; lastPrefixConfig = prefixChars;
  return compiledPrefixRegex;
}

function getTodayDate() {
  return new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
}

const groupMetadataCache = new Map(); const GROUP_CACHE_TTL = 60000; 
async function getCachedGroupMetadata(client, chatId) {
  const now = Date.now();
  if (groupMetadataCache.has(chatId) && (now - (groupMetadataCache.get(chatId).time || 0)) < GROUP_CACHE_TTL) return groupMetadataCache.get(chatId).data;
  const metadata = await client.groupMetadata(chatId).catch(() => null);
  if (metadata) groupMetadataCache.set(chatId, { data: metadata, time: now });
  return metadata;
}

function isUserInAdminList(user, adminList) {
  return adminList.some(p => p.id?.split(':')[0] === user?.split(':')[0]);
}

// --- HANDLER PRINCIPAL ---
export default async (client, m) => {
  if (!m?.message) return;

  const sender = m.sender.split(':')[0] + '@s.whatsapp.net';
  const myNumber = '51983564381@s.whatsapp.net'; // Respaldo de seguridad

  // 1. Cuerpo del mensaje
  let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply?.selectedRowId || m.message.templateButtonReplyMessage?.selectedId || m.message.interactiveResponseMessage?.body?.text || '';

  if (/3EB0|BAE5|B24E/.test(m.id)) return;

  // 2. Base de Datos e Inicialización
  try { initDB(m, client); } catch (e) { console.error(chalk.red("Error DB:"), e); return; }
  if (!global.db?.data) return;
  antilink(m, client);

  const from = m.key.remoteJid;
  const selfId = client.user.id.split(':')[0] + "@s.whatsapp.net";
  const settings = global.db.data.settings[selfId] || {};
  const rawPrefijo = settings.prefijo || '#/';
  const prefas = Array.isArray(rawPrefijo) ? rawPrefijo : [rawPrefijo];
  const botname2 = settings.namebot2 || 'Musicart';

  // 3. Sistema de Prefijos
  const prefixRegex = getOrCompilePrefix(botname2, prefas.join(''));
  const prefixMatch = body.match(prefixRegex);
  const prefix = prefixMatch ? prefixMatch[0] : null;

  // Estadísticas de mensajes
  const todayDate = getTodayDate();
  const chat = global.db.data.chats[from] || {};
  const tf = chat.users?.[m.sender] || {};
  if (tf && Object.keys(tf).length > 0) {
      if (!tf.stats) tf.stats = {};
      if (!tf.stats[todayDate]) tf.stats[todayDate] = { msgs: 0, cmds: 0 };
      tf.stats[todayDate].msgs++;
      tf.lastseen = Date.now();
  }

  if (!prefix) return;

  // 4. Argumentos y Comando (CORREGIDO PARA PLAY)
  const args = body.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  const text = args.join(' ');

  // 5. Búsqueda de Comando / Alias
  const cmdData = global.comandos.get(command) || [...global.comandos.values()].find(c => c.alias && c.alias.includes(command));
  
  if (!cmdData) {
    if (settings.prefijo === true) return;
    return; // Evita spam si el comando no existe
  }

  // 6. Información de Grupo y Permisos
  const pushname = m.pushName || 'Sin nombre';
  let groupMetadata = m.isGroup ? await getCachedGroupMetadata(client, m.chat) : null;
  let groupAdmins = groupMetadata?.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin') || [];
  
  const isBotAdmins = m.isGroup ? isUserInAdminList(selfId, groupAdmins) : false;
  const isAdmins = m.isGroup ? isUserInAdminList(sender, groupAdmins) : false;
  const isVotOwn = global.ownerSet.has(sender) || sender === myNumber;

  // Log de Consola
  console.log(chalk.cyan(`𝄢 · • —– ٠ ✤ ٠ —– • ·✧༄\n❚ ▸ 𝐁𝐎𝐓 ❱❱ ${selfId}\n❚ ▸ 𝐔𝐒𝐔𝐀𝐑𝐈𝐎 ❱❱ ${pushname}\n❚ ▸ 𝐂𝐎𝐌𝐀𝐍𝐃𝐎 ❱❱ ${prefix + command}\n𝄢 · • —– ٠ ✤ ٠ —– • ·✧༄`));

  // 7. Validaciones de Seguridad
  if (chat.bannedGrupo && !isVotOwn) return;
  if (tf.banned && !isVotOwn) return m.reply(`ꕥ Has sido vetado.`);
  
  const userNumber = sender.replace(/\D/g, '');
  if (global.blacklistSet.has(userNumber) && !isVotOwn) return m.reply('`𑁍` Estás en la lista negra.');

  if (cmdData.isOwner && !isVotOwn) return m.reply(`ꕤ Solo el Owner puede usar *${prefix}${command}*.`);
  if (cmdData.isAdmin && !isAdmins) return m.reply('Necesitas ser Admin.');
  if (cmdData.botAdmin && !isBotAdmins) return m.reply('Necesito ser Admin.');

  // 8. Ejecución Final
  try {
    await client.readMessages([m.key]).catch(() => {});
    
    const userGlobal = global.db.data.users[m.sender] || {};
    userGlobal.usedcommands = (userGlobal.usedcommands || 0) + 1;
    userGlobal.exp = (userGlobal.exp || 0) + Math.floor(Math.random() * 100);
    userGlobal.name = pushname;
    
    if (tf.stats?.[todayDate]) tf.stats[todayDate].cmds++;

    // Ejecución compatible con objetos { args, text... }
    await cmdData.run(client, m, { 
        args, 
        text, 
        command, 
        prefix, 
        groupMetadata,
        isAdmins,
        isBotAdmins,
        isVotOwn
    });

  } catch (error) {
    console.error(chalk.red(`[ RUN ERROR ] →`), error);
    if (!error.message.includes('db.write')) { // Ignorar error de escritura para evitar crash
        return m.reply('🌱 Error al ejecutar el comando.');
    }
  }
  level(m);
};
