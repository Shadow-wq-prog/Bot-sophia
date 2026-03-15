/*
Creador: Shadow Flash
https://chat.whatsapp.com/IyxuHbUdgvYBcVit6sThOO
*/

import "./preload.js"
import "./settings.js"
import { setTimeout as _setTimeout, setInterval as _setInterval } from 'node:timers';
import handler from './handler.js'
import events from './commands/events.js'
import router from './router.js'
import {
  Browsers,
  makeWASocket,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  jidDecode,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import cfonts from 'cfonts';
import pino from "pino";
import qrcode from "qrcode-terminal";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import readlineSync from "readline-sync";
import boxen from 'boxen';
import { smsg } from "./lib/message.js";
import { startSubBot } from './lib/subs.js';
import { startModBot } from './lib/mods.js';
import { startPremBot } from './lib/prems.js';
import { exec } from "child_process";
import db from "./lib/system/database.js";

const log = {
  info: (msg) => console.log(chalk.bgBlue.white.bold(`INFO`), chalk.white(msg)),
  success: (msg) => console.log(chalk.bgGreen.white.bold(`SUCCESS`), chalk.greenBright(msg)),
  warn: (msg) => console.log(chalk.bgYellowBright.blueBright.bold(`WARNING`), chalk.yellow(msg)),
  warning: (msg) => console.log(chalk.bgYellowBright.red.bold(`WARNING`), chalk.yellow(msg)),
  error: (msg) => console.log(chalk.bgRed.white.bold(`ERROR`), chalk.redBright(msg)),
};

const askQuestion = readlineSync;
let usarCodigo = false;
let numero = "";
let phoneInput = "";

const DIGITS = (s = "") => String(s).replace(/\D/g, "");

function normalizePhoneForPairing(input) {
  let s = DIGITS(input);
  if (!s) return "";
  if (s.startsWith("0")) s = s.replace(/^0+/, "");
  if (s.length === 10 && s.startsWith("3")) s = "57" + s;
  if (s.startsWith("52") && !s.startsWith("521") && s.length >= 12) s = "521" + s.slice(2);
  if (s.startsWith("54") && !s.startsWith("549") && s.length >= 11) s = "549" + s.slice(2);
  return s;
}

const { say } = cfonts;
say('armonias', {
  font: 'block',
  align: 'center',           
  gradient: ['blue', 'magenta'] 
})

say('Basado en Sophia Wa-Bot by SpaceNight Team', {
  font: 'console',
  align: 'center',
  gradient: ['green', 'blue']
})

console.log(chalk.bold.rgb(100, 100, 255)('\n' + ' '.repeat(12) + 'Creado por: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗'));

const BOT_TYPES = [
  { name: 'SubBot', folder: './Sessions/Subs', starter: startSubBot },
  { name: 'ModBot', folder: './Sessions/Mods', starter: startModBot },
  { name: 'PremBot', folder: './Sessions/Prems', starter: startPremBot }
];

global.conns = global.conns || [];
const reconnecting = new Map();
const connectedUsers = new Set(global.conns.map(c => c.userId));
const jidRegex = /:\d+@/gi;

async function loadBots() {
  for (const { name, folder, starter } of BOT_TYPES) {
    if (!fs.existsSync(folder)) continue;
    const botIds = fs.readdirSync(folder);

    for (const userId of botIds) {
      const sessionPath = path.join(folder, userId);
      const credsPath = path.join(sessionPath, 'creds.json');
      if (!fs.existsSync(credsPath)) continue;
      if (connectedUsers.has(userId) || reconnecting.has(userId)) continue;

      try {
        reconnecting.set(userId, true);
        await starter(null, null, 'Auto reconexión', false, userId, sessionPath);
        connectedUsers.add(userId); 
      } catch (e) {
        reconnecting.delete(userId);
      }
      await new Promise((res) => _setTimeout(res, 1500));
    }
  }
  _setTimeout(loadBots, 60 * 1000);
}

const displayLoadingMessage = () => {
  console.log(chalk.bold.redBright(`\n\nPor favor, Ingrese el número de WhatsApp.\n` +
      `${chalk.bold.yellowBright("Ejemplo: +54911********")}\n` +
      `${chalk.bold.magentaBright('---> ')} `));
};

if (!fs.existsSync(`./Sessions/Owner/creds.json`)) {
  let lineM = '⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ 》';
  const opcion = askQuestion.question(`╭${lineM}  
┊ ${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊ ${chalk.blueBright('┊')} ${chalk.blue.bgBlue.bold.cyan('MÉTODO DE VINCULACIÓN')}
┊ ${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}   
┊ ${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}     
┊ ${chalk.blueBright('┊')} ${chalk.green.bgMagenta.bold.yellow('¿CÓMO DESEA CONECTARSE?')}
┊ ${chalk.blueBright('┊')} ${chalk.bold.redBright('⇢  Opción 1:')} ${chalk.greenBright('Código QR.')}
┊ ${chalk.blueBright('┊')} ${chalk.bold.redBright('⇢  Opción 2:')} ${chalk.greenBright('Código de 8 digitos.')}
┊ ${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
╰${lineM}\n${chalk.bold.magentaBright('---> ')}`);
  usarCodigo = (opcion === "2");
  if (usarCodigo) {
    displayLoadingMessage();
    phoneInput = askQuestion.question("");
    numero = normalizePhoneForPairing(phoneInput);
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(global.sessionName);
  const { version } = await fetchLatestBaileysVersion();
  const logger = pino({ level: "silent" });

  const clientt = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: Browsers.macOS('Chrome'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    getMessage: async () => "",
    keepAliveIntervalMs: 45000,
    maxIdleTimeMs: 60000,
  });

  global.client = clientt;
  if (client.ev && !client.ev.setMaxListeners) client.ev.setMaxListeners = (n) => {};
  client.isInit = false;
  client.ev.on("creds.update", saveCreds);

  if (usarCodigo && !state.creds.registered) {
    _setTimeout(async () => {
      try {
        const pairing = await client.requestPairingCode(numero);
        const codeBot = pairing?.match(/.{1,4}/g)?.join("-") || pairing;
        console.log(chalk.bold.white(chalk.bgBlue(`CÓDIGO DE VINCULACIÓN:`)), chalk.bold.white(chalk.white(codeBot)));
      } catch {}
    }, 3000);
  }

  client.ev.on("connection.update", async (update) => {
    const { qr, connection, lastDisconnect, isNewLogin, receivedPendingNotifications } = update;
    if (qr && !usarCodigo) qrcode.generate(qr, { small: true });

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode || 0;
      if ([DisconnectReason.connectionLost, DisconnectReason.connectionClosed, DisconnectReason.restartRequired, DisconnectReason.timedOut, DisconnectReason.badSession].includes(reason)) {
        startBot();
      } else if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.forbidden) {
        log.error("Sesión cerrada.");
        exec("rm -rf ./Sessions/Owner/*");
        process.exit(1);
      } else {
        startBot();
      }
    }

    if (connection == "open") {
      console.log(boxen(chalk.bold(' ¡CONECTADO CON WHATSAPP! '), { borderStyle: 'round', borderColor: 'green', title: chalk.green.bold('● CONEXIÓN ●'), titleAlignment: 'center', float: 'center' }));
      
      // --- LÓGICA DE AVISO DE REINICIO MEJORADA ---
      _setTimeout(async () => {
        // 1. Aviso mediante Base de Datos (lastChat)
        if (global.db && global.db.data && global.db.data.lastChat) {
          const lastChat = global.db.data.lastChat;
          await clientt.sendMessage(lastChat, { 
              text: '✅ *REINICIO COMPLETADO*\n\nEl sistema se ha actualizado y ya está operando con normalidad. ¡Listo para usar! 亗' 
          });
          global.db.data.lastChat = null;
          if (global.db.write) await global.db.write();
        }

        // 2. Aviso para Sub-Bots o Configuraciones (lastChatRestart)
        const selfId = clientt.user.id.split(':')[0] + "@s.whatsapp.net";
        if (global.db?.data?.settings?.[selfId]?.lastChatRestart) {
          const target = global.db.data.settings[selfId].lastChatRestart;
          await clientt.sendMessage(target, { 
              text: '🚀 *SISTEMA EN LÍNEA*\nReiniciado correctamente después de la actualización de archivos core.' 
          });
          global.db.data.settings[selfId].lastChatRestart = null;
          if (global.db.write) await global.db.write();
        }

        // 3. Aviso mediante restart_flag.txt (Retrocompatibilidad)
        const restartFlagPath = path.join(process.cwd(), 'restart_flag.txt');
        if (fs.existsSync(restartFlagPath)) {
          try {
            const destination = fs.readFileSync(restartFlagPath, 'utf-8').trim();
            const msg = '*『Mυʂιƈαɾƚ ɯα Ⴆσ႕』* ```se ha reiniciado con éxito```';
            if (destination.includes('@')) await clientt.sendMessage(destination, { text: msg });
            fs.unlinkSync(restartFlagPath); 
          } catch {}
        }
      }, 5000); // Espera de 5 segundos para estabilidad de conexión
    }
  });

  client.ev.on("messages.upsert", async ({ messages }) => {
    try {
      let m = messages[0];
      if (!m || !m.message) return;
      m.message = Object.keys(m.message)[0] === "ephemeralMessage" ? m.message.ephemeralMessage.message : m.message;
      if (m.key && m.key.remoteJid === "status@broadcast") return;
      m = await smsg(client, m);
      handler(client, m, messages);
      await events(client, m);
    } catch (err) {}
  });

  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (jidRegex.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };
}

(async () => {
  try {
    if (typeof global.loadDatabase === 'function') await global.loadDatabase();
    else if (db && typeof db.loadDatabase === 'function') await db.loadDatabase();
  } catch (e) {}
  await loadBots();
  await startBot();
})();
