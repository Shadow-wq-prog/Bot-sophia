/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Optimizado para: Shadow-wq-prog (Bot-sophia)
*/

import fetch from 'node-fetch'

export default {
  command: ['play', 'mp3', 'ytmp3'],
  category: 'downloads',
  run: async (client, m, { text, args }) => {
    // Intentamos obtener el texto de varias formas para que no falle
    const query = text || args.join(' ') || (m.quoted && m.quoted.text);
    
    if (!query) return m.reply('《✧》Por favor, indica el nombre de la canción.');

    await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

    try {
      // Usamos tu Key activa: evogb-zrJLIAnF
      const api_key = global.api.key || 'evogb-zrJLIAnF';
      const apiUrl = `https://api.evogb.org/dl/youtubeplay?query=${encodeURIComponent(query)}&apikey=${api_key}`;

      const response = await fetch(apiUrl);
      const res = await response.json();

      if (!res.status || !res.data) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply('《✧》 No encontré resultados. Intenta con otro nombre.');
      }

      const { title, thumbnail, download, author, duration } = res.data;

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

      // 2. Audio directo
      await client.sendMessage(m.chat, { 
        audio: { url: download.url }, 
        fileName: `${title}.mp3`, 
        mimetype: 'audio/mpeg' 
      }, { quoted: m });

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
      console.error(e);
      await m.reply("《✧》 Error al conectar con Evogb. Intenta de nuevo.");
    }
  }
}
