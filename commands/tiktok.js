/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: Estable - Sin Marca de Agua
*/

import fetch from 'node-fetch';

export default {
    command: ['tiktok', 'tk', 'tt'],
    alias: ['tiktokdl'],
    run: async (client, m, { text }) => {
        if (!text) return m.reply('✨ *Por favor, envía un enlace de TikTok.*');
        if (!text.includes('tiktok.com')) return m.reply('❌ *El enlace no es válido.*');

        try {
            await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            // Usaremos una API estable de descarga
            const res = await fetch(`https://api.lolhuman.xyz/api/tiktok?apikey=GataDios&url=${text}`);
            const json = await res.json();

            if (!json.result || !json.result.link) {
                throw new Error('No se pudo obtener el video. Es posible que sea privado o el enlace esté roto.');
            }

            const { link, title, author, nickname } = json.result;

            let caption = `亗 *TIKTOK DOWNLOADER* 亗\n\n`;
            caption += `📝 *Título:* ${title || 'Sin título'}\n`;
            caption += `👤 *Usuario:* ${nickname} (@${author})\n\n`;
            caption += `> ⚙️ Cargando video sin marca de agua...`;

            await client.sendMessage(m.chat, { 
                video: { url: link }, 
                caption: caption,
                fileName: `tiktok.mp4` 
            }, { quoted: m });

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error(e);
            m.reply(`❌ *FALLO:* ${e.message}`);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        }
    }
};
