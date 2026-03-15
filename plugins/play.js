/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Optimizado para: Shadow-wq-prog (Bot-sophia)
*/

import fetch from 'node-fetch';

export default {
  command: ['play', 'mp3', 'ytmp3'],
  category: 'downloader',
  run: async (client, m, args) => {
    try {
      // Usamos args para capturar el texto después del comando
      const text = args.join(' '); 
      if (!text) return m.reply('《✧》Por favor, indica el nombre de la canción.');

      await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

      // CONFIGURACIÓN DE URL PARA EVOGB
      const apiUrl = `https://api.evogb.org/dl/youtubeplay?query=${encodeURIComponent(text)}&apikey=${global.api.key}`;

      const response = await fetch(apiUrl);
      const res = await response.json();

      if (!res.status || !res.data) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply('《✧》 No se encontraron resultados. Verifica tu API Key en settings.js.');
      }

      const { title, author, duration, thumbnail, download } = res.data;

      const caption = `➥ *DESCARGA FINALIZADA*\n\n` +
                      `> ✿⃘࣪◌ ֪ *Título:* ${title}\n` +
                      `> ✿⃘࣪◌ ֪ *Canal:* ${author}\n` +
                      `> ✿⃘࣪◌ ֪ *Duración:* ${duration}\n\n` +
                      `𐙚 _Enviando audio..._`;

      // 1. Enviamos la miniatura con la info
      await client.sendMessage(m.chat, { 
        image: { url: thumbnail }, 
        caption 
      }, { quoted: m });

      // 2. Enviamos el audio directamente desde la URL de la API
      await client.sendMessage(m.chat, { 
        audio: { url: download.url }, 
        fileName: `${title}.mp3`, 
        mimetype: 'audio/mpeg' 
      }, { quoted: m });

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
      console.error(e);
      await m.reply("《✧》 Error al conectar con el servidor de música.");
    }
  }
};
