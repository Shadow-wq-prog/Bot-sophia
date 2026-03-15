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

console.log(chalk.bold.rgb(100, 100, 255)('\n' + ' '.repeat(17) + ' "Libertango"' + '\n'));

console.log(chalk.bold.rgb(100, 100, 255)('\n' + ' '.repeat(15) + '"by Astor Piazzolla"' + '\n'));

console.log(chalk.bold.rgb(100, 100, 255)('\n' + ' '.repeat(21) + '"Łҽóɳ"' + '\n'));

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

/*
async function cleanOrphanedFolders() {
  const botTypes = BOT_TYPES.filter(bt => fs.existsSync(bt.folder));
  for (const { folder } of botTypes) {
    const sessionIds = fs.readdirSync(folder);
    for (const sessionId of sessionIds) {
      const sessionPath = path.join(folder, sessionId);
      const credsPath = path.join(sessionPath, 'creds.json');
      if (fs.existsSync(credsPath)) {
        const isConnected = global.conns.some(c => c.userId === sessionId);
        if (!isConnected && !reconnecting.has(sessionId)) {
          try {
            const credsData = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
            if (!credsData.noiseKey || !credsData.signedIdentityKey || !credsData.me?.id) {
              log.warn(`Carpeta huérfana detectada y eliminada: ${sessionPath}`);
              fs.rmSync(sessionPath, { recursive: true, force: true });
            }
          } catch (e) {
            log.error(`Carpeta corrupta eliminada: ${sessionPath}`);
            try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch {}
          }
        }
      }
    }
  }
}

_setInterval(cleanOrphanedFolders, 10 * 60 * 1000);
_setTimeout(cleanOrphanedFolders, 5000);
*/

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
┊ ${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}     
┊ ${chalk.blueBright('┊')} ${chalk.italic.magenta('Escriba sólo el número de')}
┊ ${chalk.blueBright('┊')} ${chalk.italic.magenta('la opción para conectarse.')}
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

  console.info = () => {};
  console.debug = () => {};

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

  client.sendText = (jid, text, quoted = "", options) => client.sendMessage(jid, { text: text, ...options }, { quoted });

  clientt.ev.on("connection.update", async (update) => {
    const { qr, connection, lastDisconnect, isNewLogin, receivedPendingNotifications } = update;
    if (qr && !usarCodigo) qrcode.generate(qr, { small: true });

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode || 0;
      if ([DisconnectReason.connectionLost, DisconnectReason.connectionClosed, DisconnectReason.restartRequired, DisconnectReason.timedOut, DisconnectReason.badSession].includes(reason)) {
        log.warning(`Reconectando por código: ${reason}`);
        startBot();
      } else if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.forbidden) {
        log.error("Sesión cerrada.");
        exec("rm -rf ./Sessions/Owner/*");
        process.exit(1);
      } else if (reason === DisconnectReason.connectionReplaced) {
        log.warning("Primero cerrá la sesión actual...");
      } else if (reason === DisconnectReason.multideviceMismatch) {
        log.warning("Conflicto multidispositivo. Reiniciando...");
        exec("rm -rf ./Sessions/Owner/*");
        process.exit(0);
      } else {
        startBot();
      }
    }

    if (connection == "open") {
      console.log(boxen(chalk.bold(' ¡CONECTADO CON WHATSAPP! '), { borderStyle: 'round', borderColor: 'green', title: chalk.green.bold('● CONEXIÓN ●'), titleAlignment: 'center', float: 'center' }));
      const restartFlagPath = path.join(process.cwd(), 'restart_flag.txt');
      if (fs.existsSync(restartFlagPath)) {
        try {
          const destination = fs.readFileSync(restartFlagPath, 'utf-8').trim();
          const msg = '*『Mυʂιƈαɾƚ ɯα Ⴆσƚ』* ```se ha reiniciado con éxito```';
          if (destination.includes('@')) await clientt.sendMessage(destination, { text: msg });
          fs.unlinkSync(restartFlagPath); 
        } catch {}
      }
    }

    if (isNewLogin) {
      log.info("Nuevo dispositivo detectado.");
    }

    if (receivedPendingNotifications == "true") {
      log.warn("Por favor esperá aproximadamente 1 minuto...");
      client.ev.flush();
    }
  });

  client.ev.on("messages.upsert", async ({ messages }) => {
    try {
      let m = messages[0];
      if (!m || !m.message) return;

      m.message = Object.keys(m.message)[0] === "ephemeralMessage" ? m.message.ephemeralMessage.message : m.message;
      if (m.key && m.key.remoteJid === "status@broadcast") return;
      if (!client.public && !m.key.fromMe && messages.type === "notify") return;
      if (m.key.id.startsWith("BAE5") && m.key.id.length === 16) return;

      try {
        m = await smsg(client, m);
      } catch (smsgError) {
        if (smsgError.message?.includes('reading \'data\'')) return; 
        throw smsgError; 
      }

      if (!m || !m.chat) return; 

      handler(client, m, messages);
      try { 
        await events(client, m); 
      } catch (err) { 
        if (!err.message?.includes('reading \'data\'')) {
          console.log(chalk.gray(`[ BOT ] → ${err}`)); 
        }
      }
    } catch (err) {
      if (!err.message?.includes('Bad MAC') && 
          !err.message?.includes('ENOENT') && 
          !err.message?.includes('reading \'data\'')) {
        console.log(err);
      }
    }
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
    if (typeof global.loadDatabase === 'function') {
      await global.loadDatabase();
    } else if (db && typeof db.loadDatabase === 'function') {
      await db.loadDatabase();
    }
    console.log(chalk.gray('[ ✿ ] Base de datos SQLite cargada correctamente.'));
  } catch (e) {
    console.log(chalk.red('[ ✘ ] Error al cargar SQLite:'), e);
  }

  await loadBots();
  await startBot();
})();