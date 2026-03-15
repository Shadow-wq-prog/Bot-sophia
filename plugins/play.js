/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Adaptado para: Shadow-wq-prog (Bot-sophia)
Uso: ¥play [nombre o link]
*/

import { getBuffer } from '../lib/message.js'; // Ruta corregida
import dns from 'node:dns';
import fetch from 'node-fetch';

// Forzamos IPv4 para evitar conflictos
dns.setDefaultResultOrder('ipv4first');

async function getVideoInfo(query) {
  try {
    // Usamos global.api.url que configuraste en settings.js (EvoGB)
    const endpoint = `${global.api.url}/dl/youtubeplay?query=${encodeURIComponent(query)}&apikey=${global.api.key}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;
    const res = await response.json();
    return res.status ? res.data : null;
  } catch (e) {
    console.error(`[API Fetch Error]: ${e.message}`);
    return null;
  }
}

export default {
  command: ['play', 'mp3', 'ytmp3', 'ytaudio', 'playaudio'],
  category: 'downloader',
  run: async (client, m) => {
    try {
      // Usamos m.text que ya procesamos en lib/message.js
      const text = m.text;
      if (!text) return m.reply('《✧》Por favor, menciona el nombre o URL del video.');

      // Reacción de "procesando"
      await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

      const videoInfo = await getVideoInfo(text);

      if (!videoInfo) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply('《✧》 No se pudo obtener información del video. Revisa tu API Key de EvoGB.');
      }

      const { title, author, duration, views, url, thumbnail, download } = videoInfo;
      const vistas = (views || 0).toLocaleString();

      const caption = `➥ *DESCARGA FINALIZADA*\n\n` +
                      `> ✿⃘࣪◌ ֪ *Título:* ${title}\n` +
                      `> ✿⃘࣪◌ ֪ *Canal:* ${author}\n` +
                      `> ✿⃘࣪◌ ֪ *Duración:* ${duration}\n` +
                      `> ✿⃘࣪◌ ֪ *Vistas:* ${vistas}\n` +
                      `> ✿⃘࣪◌ ֪ *Enlace:* ${url}\n\n` +
                      `𐙚 _Enviando audio, por favor espera..._`;

      // 1. Enviamos la imagen con la info del video
      const thumbBuffer = await getBuffer(thumbnail);
      await client.sendMessage(m.chat, { image: thumbBuffer, caption }, { quoted: m });

      // 2. Verificamos si tenemos URL de descarga
      if (!download?.url) {
        return m.reply('《✧》 La API no proporcionó un enlace de descarga directo.');
      }

      // 3. Obtenemos el audio real
      console.log(`[BOT] Descargando audio de EvoGB: ${download.url}`);
      const audioBuffer = await getBuffer(download.url);

      // 4. Enviamos el mensaje de audio
      await client.sendMessage(m.chat, { 
        audio: audioBuffer, 
        fileName: `${title}.mp3`, 
        mimetype: 'audio/mpeg' 
      }, { quoted: m });

      // Reacción de éxito
      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
      console.error("[Play Error]:", e);
      await m.reply("《✧》 Error crítico al procesar la descarga.");
    }
  }
};
