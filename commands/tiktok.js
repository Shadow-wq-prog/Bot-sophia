/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: Búsqueda Directa (Sin Link) + No Watermark
*/

import fetch from 'node-fetch';

export default {
    command: ['tiktok', 'tk', 'tt'],
    alias: ['tiktoks'],
    run: async (client, m, { text, prefix, command }) => {
        if (!text) return m.reply(`✨ *¿Qué deseas buscar en TikTok?*\n\nEjemplo: *${prefix + command} Messi edit*`);

        try {
            await client.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

            // 1. Buscamos el video basándonos en el texto
            const searchRes = await fetch(`https://api.lolhuman.xyz/api/tiktoksearch?apikey=GataDios&query=${encodeURIComponent(text)}`);
            const searchJson = await searchRes.json();

            if (!searchJson.result || searchJson.result.length === 0) {
                throw new Error('No encontré ningún video con ese nombre.');
            }

            // Tomamos el primer resultado (el más relevante)
            const videoUrl = searchJson.result[0].link; 
            
            await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            // 2. Descargamos el video del link obtenido (Sin marca de agua)
            const downloadRes = await fetch(`https://api.lolhuman.xyz/api/tiktok?apikey=GataDios&url=${videoUrl}`);
            const downloadJson = await downloadRes.json();

            if (!downloadJson.result || !downloadJson.result.link) {
                throw new Error('Encontré el video pero no pude procesar la descarga.');
            }

            const { link, title, author, nickname } = downloadJson.result;

            let caption = `亗 *TIKTOK SEARCH* 亗\n\n`;
            caption += `📝 *Título:* ${title || text}\n`;
            caption += `👤 *Autor:* ${nickname} (@${author})\n\n`;
            caption += `> ⚙️ *Enviando el primer resultado de la búsqueda...*`;

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
