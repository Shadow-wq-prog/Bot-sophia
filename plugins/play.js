/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Optimizado para: Shadow-wq-prog (Bot-sophia)
*/

import { getBuffer } from '../lib/message.js'; 
import fetch from 'node-fetch';

export default {
  command: ['play', 'mp3', 'ytmp3'],
  category: 'downloader',
  run: async (client, m) => {
    try {
      const text = m.text; // Usamos el texto que ya procesa tu smsg
      if (!text) return m.reply('《✧》Por favor, indica el nombre de la canción.');

      await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

      // --- CONFIGURACIÓN DE URL PARA EVOGB ---
      // El servidor espera: ?query=NOMBRE&apikey=KEY
      const apiUrl = `https://api.evogb.org/dl/youtubeplay?query=${encodeURIComponent(text)}&apikey=${global.api.key}`;

      const response = await fetch(apiUrl);
      const res = await response.json();

      if (!res.status || !res.data) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply('《✧》 No encontré resultados. Revisa que tu API Key en settings.js sea correcta.');
      }

      const { title, author, duration, thumbnail, download } = res.data;

      const caption = `➥ *DESCARGA FINALIZADA*\n\n` +
                      `> ✿⃘࣪◌ ֪ *Título:* ${title}\n` +
                      `> ✿⃘࣪◌ ֪ *Canal:* ${author}\n` +
                      `> ✿⃘࣪◌ ֪ *Duración:* ${duration}\n\n` +
                      `𐙚 _Enviando audio..._`;

      // 1. Enviamos la miniatura con la info
      const thumbBuffer = await getBuffer(thumbnail);
      await client.sendMessage(m.chat, { image: thumbBuffer, caption }, { quoted: m });

      // 2. Enviamos el audio directamente
      // Usamos download.url que es el enlace directo que da EvoGB
      await client.sendMessage(m.chat, { 
        audio: { url: download.url }, 
        fileName: `${title}.mp3`, 
        mimetype: 'audio/mpeg' 
      }, { quoted: m });

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
      console.error(e);
      await m.reply("《✧》 Error al conectar con el servidor de descargas.");
    }
  }
};
