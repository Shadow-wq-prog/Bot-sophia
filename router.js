import {
  Browsers,
  makeWASocket,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  jidDecode,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import pino from "pino";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import express from 'express';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';
import { startModBot } from './lib/mods.js';
import { startPremBot } from './lib/prems.js';
import { startSubBot } from './lib/subs.js';

if (!global.conns) global.conns = [];
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const groupCache = new NodeCache({ stdTTL: 3600, checkperiod: 300 });
let reintentos = {};

const cleanJid = (jid = '') => jid.replace(/:\d+/, '').split('@')[0];

export default async (client, m) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const logger = express();
  // Puertos del servidor web
const PORT = process.env.PORT || 30056;        // Puerto principal
const PORT2 = process.env.PORT || 30057;       // Puerto secundario
  const basePath = path.join(__dirname, './Sessions');

  const getBotsFromFolder = (folderName) => {
    const folderPath = path.join(basePath, folderName);
    if (!fs.existsSync(folderPath)) return [];
    return fs
      .readdirSync(folderPath)
      .filter((dir) => {
        const credsPath = path.join(folderPath, dir, 'creds.json');
        return fs.existsSync(credsPath);
      })
      .map((id) => id.replace(/\D/g, ''));
  };

  logger.get('/bots/summary', (req, res) => {
    try {
      const subs = getBotsFromFolder('Subs');
      const mods = getBotsFromFolder('Mods');
      const prems = getBotsFromFolder('Prems');

      const totalBots = 1 + subs.length + mods.length + prems.length;

      const uptime = process.uptime();
      const seconds = Math.floor(uptime % 60);
      const minutes = Math.floor((uptime / 60) % 60);
      const hours = Math.floor((uptime / 3600) % 24);
      const days = Math.floor(uptime / 86400);

      const formattedUptime = `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
      const currentTime = new Date().toLocaleString();

      return res.json({
        activeBots: totalBots,
        uptime: formattedUptime,
        time: currentTime,
        message: 'Resumen de bots obtenido exitosamente.',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error al obtener el resumen de bots.' });
    }
  });

  const DIGITS = (s = "") => String(s).replace(/\D/g, "");

  function normalizePhoneForPairing(input) {
    let s = DIGITS(input);
    if (!s) return "";
    if (s.startsWith("0")) s = s.replace(/^0+/, "");
    if (s.length === 10 && s.startsWith("3")) {
      s = "57" + s;
    }
    if (s.startsWith("52") && !s.startsWith("521") && s.length >= 12) {
      s = "521" + s.slice(2);
    }
    if (s.startsWith("54") && !s.startsWith("549") && s.length >= 11) {
      s = "549" + s.slice(2);
    }
    return s;
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  logger.use(express.json());
  logger.get('/', (req, res) => {
    return res.redirect('/dash');
  });
  logger.get('/favicon.ico', (req, res) => {
    return res.redirect('https://api.stellarwa.xyz/favicon.ico');
  });
  logger.get('/dash', (req, res) => {
    res.sendFile(path.join(__dirname, 'lib', 'public', 'index.html'));
  });
  logger.get('/script', (req, res) => {
    res.sendFile(path.join(__dirname, 'lib', 'public', 'status.js'));
  });
  logger.get('/styles', (req, res) => {
    res.sendFile(path.join(__dirname, 'lib', 'public', 'styles.css'));
  });

  const sockets = new Map();
  const sessions = new Map();

  async function startSocketIfNeeded(phone, botType) {
    if (sockets.has(phone)) return sockets.get(phone);

        const pho = normalizePhoneForPairing(phone)

        const dir = path.join(__dirname, './Sessions/', 
      botType === 'moderador' ? 'Mods' : 
      botType === 'premium' ? 'Prems' : 
      'Subs', pho
    );

    fs.mkdirSync(dir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const { version } = await fetchLatestBaileysVersion();

    const s = makeWASocket({
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: Browsers.macOS('Chrome'),
      auth: state,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      getMessage: async () => '',
      msgRetryCounterCache,
      userDevicesCache,
      cachedGroupMetadata: async (jid) => groupCache.get(jid),
      version,
      keepAliveIntervalMs: 60000,
      maxIdleTimeMs: 120000,
    });

    s.isInit = false;
    s.ev.on('creds.update', saveCreds);
    s.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
      } else return jid;
    };

     let typeFn =
  botType.toLowerCase() === 'moderador' ? startModBot :
  botType.toLowerCase() === 'premium'   ? startPremBot :
                                          startSubBot;

    s.ev.on('connection.update', async ({ connection, lastDisconnect, isNewLogin, qr }) => {
      if (isNewLogin) s.isInit = false;

      if (connection === 'open') {
        s.isInit = true;
        s.uptime = Date.now();
        s.userId = cleanJid(s.user?.id?.split('@')[0]);

        if (!global.conns.find((c) => c.userId === s.userId)) {
          global.conns.push(s);
        }

        delete reintentos[s.userId || phone];
      }

      if (connection === 'close') {
        const botId = s.userId || phone;
        const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.reason || 0;
        const intentos = reintentos[botId] || 0;
        reintentos[botId] = intentos + 1;

        if ([401, 403].includes(reason)) {
          if (intentos < 5) {
            console.log(chalk.gray(`[ ✿  ]  ${botId} Conexión cerrada (código ${reason}) intento ${intentos}/5 → Reintentando...`));
            setTimeout(() => {
            typeFn(null, null, 'Auto reinicio', false, pho, null);
            }, 3000);
          } else {
            console.log(chalk.gray(`[ ✿  ]  ${botId} Falló tras 5 intentos. Eliminando sesión.`));
            try {
              fs.rmSync(path.join(basePath, botType === 'Moderador' ? 'Mods' : botType === 'Premium' ? 'Prems' : 'Subs', pho), { recursive: true, force: true });
            } catch (e) {
              console.error(`[ ✿  ] No se pudo eliminar la carpeta`, e);
            }
            delete reintentos[botId];
          }
          return;
        }

        if ([DisconnectReason.connectionClosed, DisconnectReason.connectionLost, DisconnectReason.timedOut, DisconnectReason.connectionReplaced].includes(reason)) {
          setTimeout(() => {
           typeFn(null, null, 'Auto reinicio', false, pho, null);
          }, 3000);
          return;
        }

        setTimeout(() => {
        typeFn(null, null, 'Auto reinicio', false, pho, null);
        }, 3000);
      }
    });
    return s;
  }

async function getStatus(phone) {
  const normalizedPhone = normalizePhoneForPairing(phone);
  const sessionDirectories = ['Subs', 'Mods', 'Prems'];

  const exists = sessionDirectories.some(dir => {
    const dirPath = path.join(__dirname, 'Sessions', dir, normalizedPhone, 'creds.json');
    return fs.existsSync(dirPath);
  });

  return {
    connected: exists,
    number: exists ? normalizedPhone : ""
  };
}

  async function requestPairingCode(rawPhone, botType) {
    const phoneDigits = normalizePhoneForPairing(rawPhone);
    if (!phoneDigits) throw new Error("Número inválido. Usa solo dígitos con código de país.");
    const s = await startSocketIfNeeded(phoneDigits, botType);
    if (s.user) {
      const jid = s.user.id || "";
      const num = DIGITS(jid.split("@")[0]);
      const session = sessions.get(phoneDigits) || {};
      session.connectedNumber = num;
      session.detect = true;
      sessions.set(phoneDigits, session);
      return null;
    }
    await sleep(1500);
    const code = await s.requestPairingCode(phoneDigits, 'STBOTMD1');
    const pretty = String(code).match(/.{1,4}/g)?.join("-") || code;
    return pretty;
  }

  async function startPairing(rawPhone, botType) {
    const phone = normalizePhoneForPairing(rawPhone);
    const st = await getStatus(phone);
    const numbot = st.number + "@s.whatsapp.net";
    if (!numbot) return { ok: false, message: 'Número inválido o no conectado.' };
    if (st.connected) {
      return {
        ok: true,
        connected: true,
        number: numbot,
        message: `✎ Conectado como ${numbot}`
      };
    }
    const code = await requestPairingCode(phone, botType);
    return {
      ok: true,
      connected: false,
      code,
      message: `${code}`
    };
  }

  logger.post('/api/verify-recaptcha', async (req, res) => {
    const { token, action } = req.body;
    if (!token || !action) {
      return res.status(400).json({ message: 'Token o acción no proporcionados.' });
    }

    const secretKey = '6Lc82_crAAAAAFboG6u-ZAS6itgGSsh38sbEJDiW';

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${secretKey}&response=${token}`
      });

      const data = await response.json();

      if (!data.success || data.action !== action || data.score < 0.5) {
        return res.status(400).json({ message: 'Verificación de reCAPTCHA fallida.' });
      }

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error en la verificación de reCAPTCHA.' });
    }
  });

  logger.post('/start-pairing', async (req, res) => {
    const { phone, label, botType, token } = req.body;
    if (!phone) return res.status(400).json({ message: 'Número de teléfono no proporcionado' });

const pho = normalizePhoneForPairing(phone)

    let tokenData;
    const now = Date.now();
    if (botType === 'moderador') {
      tokenData = global.db.data.tokensmod?.[token]; 
    } else if (botType === 'premium') {
      tokenData = global.db.data.tokens?.[token]; 
    } else if (botType === 'subbot') {
      tokenData = null;
    } else {
      return res.status(400).json({ message: 'Tipo de bot no válido' });
    }

    if (botType !== 'subbot' && !tokenData) {
      return res.status(400).json({ ok: false, error: `El token proporcionado no es válido para el tipo de bot ${botType}.` });
    }

    if (tokenData && tokenData.expires < now) {
      return res.status(400).json({ ok: false, error: 'Este token ha expirado.' });
    }

    const basePath = path.join(__dirname, './Sessions/', 
      botType === 'moderador' ? 'Mods' : 
      botType === 'premium' ? 'Prems' : 
      'Subs', pho
    );

    const activeBots = fs.existsSync(basePath) ? fs.readdirSync(basePath) : [];

    const activeUser = tokenData?.active;
    const activeNumber = activeUser?.split('@')[0];
    const isConnected = activeUser && activeBots.includes(activeNumber);
    const isSameUser = activeUser === pho + "@s.whatsapp.net"; 

    if (activeUser) {
      if (isConnected && !isSameUser) {
        return res.json({
          ok: false,
          error: `Este token ya está siendo utilizado por otro bot activo: @${activeNumber}. Si crees que esto es un error, contacta con un moderador.`
        });
      }
    } else {
      if (tokenData) {
        tokenData.active = pho + "@s.whatsapp.net"; 
      }
    }

    const botRecord = { 
      idDigits: pho, 
      jid: pho + "@s.whatsapp.net", 
      label: label || null, 
      status: 'pending', 
      createdAt: now, 
      updatedAt: now
    };

    try {
      const pairingResult = await startPairing(phone, botType);
      if (pairingResult.connected) {
        return res.json({
          message: `✎ Bot conectado como ${pairingResult.number}. Cargando edición...`,
          connected: true,
          number: pairingResult.number
        });
      }
      res.json({ ok: true, id: botRecord.jid, code: pairingResult.code, status: pairingResult.status, bot: botRecord });
    } catch (error) {
      return res.status(500).json({ message: 'Error al conectar el bot.' });
    }
  });

  logger.post('/edit-bot', async (req, res) => {
    const { phone, longName, shortName, canal, prefix, owner, banner, icon, currency, bodyMenu, menu, link } = req.body;
    if (!phone) return res.status(400).json({ message: 'Número de teléfono no proporcionado' });

      const channelUrl = canal.match(/(?:https:\/\/)?(?:www\.)?(?:chat\.|wa\.)?whatsapp\.com\/(?:channel\/|joinchat\/)?([0-9A-Za-z]{22,24})/i)?.[1]

    const info = await client.newsletterMetadata('invite', channelUrl);
    if (!info) {
      return res.status(404).json({ message: 'No se pudo obtener información del canal.' });
    }

    const phoneNormalized = normalizePhoneForPairing(phone);
    const idBot = phoneNormalized + "@s.whatsapp.net";

    global.db.data.settings[idBot] = {
      namebot: longName || global.db.data.settings[idBot].longName,
      namebot2: shortName || global.db.data.settings[idBot].shortName,
      banner: banner || global.db.data.settings[idBot].banner,
      icon: icon || global.db.data.settings[idBot].icon,
      currency: currency || global.db.data.settings[idBot].currency,
      prefijo: prefix || global.db.data.settings[idBot].prefix,
      owner: owner || global.db.data.settings[idBot].owner,
      self: global.db.data.settings[idBot].self,
      id: info.id || global.db.data.settings[idBot]?.id, 
      nameid: info.thread_metadata?.name?.text || global.db.data.settings[idBot]?.nameid,
      bodyMenu: bodyMenu || global.db.data.settings[idBot].bodyMenu,
      menu: menu || global.db.data.settings[idBot].menu,
      type: global.db.data.settings[idBot].type || '',
      link: link || global.db.data.settings[idBot].link,
      botprem: global.db.data.settings[idBot].botprem || '',
      botmod: global.db.data.settings[idBot].botmod || ''
    };

    res.json({ message: 'Configuración creada y actualizada.', code: "STBO-TMD1" });
  });

logger.post('/delete-bot', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ message: 'Número de teléfono no proporcionado' });
  }

  const pho = normalizePhoneForPairing(phone);

  const sessionDirs = ['Subs', 'Mods', 'Prems'];

  let deleted = false;

  for (const dir of sessionDirs) {
    const botSessionPath = path.join(__dirname, 'Sessions', dir, pho);

    if (fs.existsSync(botSessionPath)) {
      try {
        fs.rmSync(botSessionPath, { recursive: true, force: true });
        deleted = true;
      } catch (err) {
        return res.status(500).json({ message: `Error al eliminar la sesión en ${dir}` });
      }
    }
  }

  if (deleted) {
    res.json({ message: 'Bot eliminado exitosamente.' });
  } else {
    res.json({ message: 'Bot eliminado exitosamente.' });
  }
});

  logger.post('/bots/reload', async (req, res) => {
    const phone = String(req.body.phone || '').trim();
    const botType = req.body.botType

    if (!phone) return res.status(400).json({ ok: false, error: 'El campo phone es requerido.' });

    const idDigits = normalizePhoneForPairing(phone);
   let typeFn = botType.toLowerCase() === 'moderador' ? startModBot : botType.toLowerCase() === 'premium'   ? startPremBot : startSubBot;
     
    try {
      setTimeout(() => {
        typeFn(null, null, 'Auto reinicio', false, idDigits, null);
      }, 3000);

      return res.json({ ok: true, message: 'Bot reiniciado correctamente.' });
    } catch {
      return res.status(500).json({ ok: false, error: 'Error al reiniciar el bot.' });
    }
  });

logger.get('/bots/status', async (req, res) => {
  try {
    const phone = String(req.query.phone || '').trim();
    if (!phone) return res.status(400).json({ ok: false, error: 'El campo phone es requerido.' });

    const idDigits = normalizePhoneForPairing(phone); 

    const s = await getStatus(idDigits); 
    const a = s.connected ? 'online' : 'offline'

    res.json({ ok: true, id: idDigits + "@s.whatsapp.net", status: a }); 
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

// Utilidad para formatear uptime en hh:mm:ss
function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

logger.get('/api/info-channel', async (req, res) => {
  const { value, key } = req.query;
  if (!value) {
    return res.status(400).json({ ok: false, error: 'Debes proporcionar un enlace de canal de WhatsApp.' });
  }

if (!key) {
  return res.status(400).json({ 
    ok: false, 
    error: 'Ingresa la Apikey.' 
  });
}

if (key !== 'BotWa') {
  return res.status(400).json({ 
    ok: false, 
    error: 'Esta apikey no está permitida.' 
  });
}

  try {
      const channelUrl = value.match(/(?:https:\/\/)?(?:www\.)?(?:chat\.|wa\.)?whatsapp\.com\/(?:channel\/|joinchat\/)?([0-9A-Za-z]{22,24})/i)?.[1]
    if (!channelUrl) {
      return res.status(404).json({ ok: false, error: 'No se pudo obtener el enlace.' });
    }
    const info = await client.newsletterMetadata('invite', channelUrl);
    if (!info) {
      return res.status(404).json({ ok: false, error: 'No se pudo obtener información del canal.' });
    }

    const data = {
      id: info.id || null,
      state: info.state?.type || null,
      name: info.thread_metadata?.name?.text || null,
      name_id: info.thread_metadata?.name?.id || null,
      name_update_time: info.thread_metadata?.name?.update_time || null,
      description: info.thread_metadata?.description?.text || null,
      description_id: info.thread_metadata?.description?.id || null,
      description_update_time: info.thread_metadata?.description?.update_time || null,
      invite: info.thread_metadata?.invite || null,
      handle: info.thread_metadata?.handle || null,
      creation_time: info.thread_metadata?.creation_time || null,
      picture: info.thread_metadata?.picture || null,
      preview_id: info.thread_metadata?.preview?.id || null,
      preview_type: info.thread_metadata?.preview?.type || null,
      preview_direct_path: info.thread_metadata?.preview?.direct_path ? `https://mmg.whatsapp.net${info.thread_metadata?.preview?.direct_path}` : null || null,
      settings_reactions: info.thread_metadata?.settings?.reaction_codes?.value || null,
      subscribers_count: info.thread_metadata?.subscribers_count || null,
      verification: info.thread_metadata?.verification || null,
      viewer_metadata: info.viewer_metadata || null
    };

    return res.json({ ok: true, data });
  } catch (error) {
   // console.error(error);
    return res.status(500).json({ ok: false, error: 'Error interno al obtener la información del canal.' });
  }
});

  logger.listen(PORT, () => {
  });
  
  logger.listen(PORT2, () => {
  });

  async function joinChannels(client) {
    for (const value of Object.values(global.my)) {
      if (typeof value === 'string' && value.endsWith('@newsletter')) {
        await client.newsletterFollow(value).catch(err => console.log(chalk.gray(`\n[ ✿ ] Error al seguir el canal ${value}`)));
      }
    }
  }
}
