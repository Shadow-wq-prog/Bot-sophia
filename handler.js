/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗 & Shadow Flash
Versión: Híbrida Estable (Fix ReferenceError)
*/

import moment from 'moment';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import seeCommands from './lib/system/commandLoader.js';
import initDB from './lib/system/initDB.js';
import level from './commands/level.js';
import antilink from './commands/antilink.js';
import blacklist from './blacklist.js';

seeCommands();

const myNumber = '51983564381@s.whatsapp.net'; 
const groupMetadataCache = new Map();
const GROUP_CACHE_TTL = 60000;

function updatePermissionCaches() {
  global.ownerSet = new Set((global.owner || []).map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net'));
  global.blacklistSet = new Set((blacklist || []).map(n => n.replace(/\D/g, '')));
}
updatePermissionCaches();

async function getCachedGroupMetadata(client, chatId) {
  const now = Date.now();
  if (groupMetadataCache.has(chatId) && (now - (groupMetadataCache.get(chatId).time || 0)) < GROUP_CACHE_TTL) return groupMetadataCache.get(chatId).data;
  const metadata = await client.groupMetadata(chatId).catch(() => null);
  if (metadata) groupMetadataCache.set(chatId, { data: metadata, time: now });
  return metadata;
}

export default async (client, m) => {
  if (!m?.message) return;

  // 1. Identificación limpia
  const sender = m.sender.split(':')[0] + '@s.whatsapp.net';
  const isVotOwn = sender === myNumber || global.ownerSet.has(sender);

  // 2. Extracción de Texto
  let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply?.selectedRowId || '';

  if (/3EB0|BAE5|B24E/.test(m.id)) return;

  // 3. Base de Datos e Inicialización
  try { initDB(m, client); } catch (e) {}
  if (!global.db?.data) return;
  antilink(m, client);

  const from = m.key.remoteJid;
  const selfId = client.user.id.split(':')[0] + "@s.whatsapp.net";
  const settings = global.db.data.settings[selfId] || {};
  
  // --- DEFINICIÓN DE VARIABLES DE CHAT/USUARIO (ARREGLA EL ERROR) ---
  const chat = global.db.data.chats[from] || {};
  const tf = chat.users?.[m.sender] || {};
  const todayDate = new Date().toLocaleDateString('es-CO').split('/').reverse().join('-');

  if (tf && Object.keys(tf).length > 0) {
      if (!tf.stats) tf.stats = {};
      if (!tf.stats[todayDate]) tf.stats[todayDate] = { msgs: 0, cmds: 0 };
      tf.stats[todayDate].msgs++;
      tf.lastseen = Date.now();
  }
  // ------------------------------------------------------------------

  const prefix = '¥';
  if (!body.startsWith(prefix)) return;

  const args = body.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  const text = args.join(' ');

  const cmdData = global.comandos.get(command) || [...global.comandos.values()].find(c => c.alias && c.alias.includes(command));
  if (!cmdData) return;

  let groupMetadata = m.isGroup ? await getCachedGroupMetadata(client, m.chat) : null;
  let groupAdmins = groupMetadata?.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin') || [];
  const isAdmins = m.isGroup ? groupAdmins.some(p => p.id === sender) : false;
  const isBotAdmins = m.isGroup ? groupAdmins.some(p => p.id === selfId) : false;

  console.log(chalk.cyan(`[ CMD ] → ${prefix}${command} | De: ${sender}`));

  // 4. Filtros de Seguridad
  if (chat.bannedGrupo && !isVotOwn) return;
  if (tf.banned && !isVotOwn) return m.reply(`❌ Estás vetado.`);
  if (global.blacklistSet.has(sender.replace(/\D/g, '')) && !isVotOwn) return m.reply('❌ Estás en la lista negra.');
  
  if (cmdData.isOwner && !isVotOwn) return m.reply(`❌ Solo el Owner puede usar esto.`);
  if (cmdData.isAdmin && !isAdmins && !isVotOwn) return m.reply('❌ Necesitas ser Admin.');
  if (cmdData.botAdmin && !isBotAdmins) return m.reply('❌ Necesito ser Admin.');

  // 5. Ejecución
  try {
    const userGlobal = global.db.data.users[m.sender] || {};
    userGlobal.usedcommands = (userGlobal.usedcommands || 0) + 1;
    if (tf.stats?.[todayDate]) tf.stats[todayDate].cmds++;

    await cmdData.run(client, m, { 
      args, 
      text, 
      command, 
      prefix, 
      isVotOwn, 
      isAdmins, 
      isBotAdmins, 
      groupMetadata 
    });

  } catch (error) {
    console.error(chalk.red(`[ RUN ERROR ] →`), error);
    if (!error.message.includes('db.write')) {
       m.reply('🌱 Error al ejecutar el comando.');
    }
  }

  level(m);
};
