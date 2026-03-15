/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Optimizado para: Shadow-wq-prog (Bot-sophia)
*/

import fetch from 'node-fetch';
import https from 'https';

export default {
  command: ['play', 'mp3', 'ytmp3'],
  category: 'downloader',
  run: async (client, m, { args, text }) => {
    try {
      const search = text || args.join(' '); 
      if (!search) return m.reply('《✧》Por favor, indica el nombre de la canción.');

      await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

      // Agente para ignorar errores de certificado SSL si la API bloquea
      const httpsAgent = new https.Agent({ rejectUnauthorized: false });

      const apiUrl = `https://api.evogb.org/dl/youtubeplay?query=${encodeURIComponent(search)}&apikey=${global.api.key}`;

      const response = await fetch(apiUrl, { agent: httpsAgent });
      const res = await response.json();

      if (!res.status || !res.data) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply('《✧》 No encontré resultados. Revisa que tu Key sea: evogb-zrJLIAnF');
      }

      const { title, author, duration, thumbnail, download } = res.data;

      const caption = `➥ *DESCARGA FINALIZADA*\n\n` +
                      `> ✿⃘࣪◌ ֪ *Título:* ${title}\n` +
                      `> ✿⃘࣪◌ ֪ *Canal:* ${author}\n` +
                      `> ✿⃘࣪◌ ֪ *Duración:* ${duration}\n\n` +
                      `𐙚 _Enviando audio..._`;

      // 1. Imagen con info
      await client.sendMessage(m.chat, { 
        image: { url: thumbnail }, 
        caption 
      }, { quoted: m });

      // 2. Audio directo (usando el enlace de descarga de EvoGB)
      await client.sendMessage(m.chat, { 
        audio: { url: download.url }, 
        fileName: `${title}.mp3`, 
        mimetype: 'audio/mpeg' 
      }, { quoted: m });

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
      console.error(e);
      await m.reply("《✧》 Error de conexión. Intenta de nuevo en unos segundos.");
    }
  }
};
