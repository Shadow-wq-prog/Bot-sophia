/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Optimizado para: Shadow-wq-prog (Bot-sophia)
*/

import fetch from 'node-fetch';

export default {
  command: ['play', 'mp3', 'ytmp3'],
  category: 'downloader',
  run: async (client, m, { args, text }) => { // Añadimos text y args aquí
    try {
      // Usamos 'text' o 'args' para que no ignore lo que escribes
      const search = text || args.join(' '); 
      
      if (!search) return m.reply('《✧》Por favor, indica el nombre de la canción o un link de YouTube.');

      await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

      // CONFIGURACIÓN CON TU API KEY DE EVOGB
      const apiUrl = `https://api.evogb.org/dl/youtubeplay?query=${encodeURIComponent(search)}&apikey=${global.api.key}`;

      const response = await fetch(apiUrl);
      const res = await response.json();

      if (!res.status || !res.data) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply('《✧》 No encontré resultados. Asegúrate de que tu API Key sea válida.');
      }

      const { title, author, duration, thumbnail, download } = res.data;

      const caption = `➥ *DESCARGA FINALIZADA*\n\n` +
                      `> ✿⃘࣪◌ ֪ *Título:* ${title}\n` +
                      `> ✿⃘࣪◌ ֪ *Canal:* ${author}\n` +
                      `> ✿⃘࣪◌ ֪ *Duración:* ${duration}\n\n` +
                      `𐙚 _Enviando audio, espera un momento..._`;

      // 1. Enviamos la imagen con la info
      await client.sendMessage(m.chat, { 
        image: { url: thumbnail }, 
        caption 
      }, { quoted: m });

      // 2. Enviamos el audio directo
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
