/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: V3 (Solución definitiva a Enlace Inválido)
*/

import fetch from 'node-fetch';

export default {
    command: ['tiktok', 'tk', 'tt'],
    alias: ['tiktoks'],
    run: async (client, m, { text, prefix, command }) => {
        if (!text) return m.reply(`✨ *¿Qué buscas en TikTok?*\n\nEjemplo: *${prefix + command} Messi edit*`);

        try {
            await client.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

            // 1. Búsqueda de videos
            const searchRes = await fetch(`https://api.lolhuman.xyz/api/tiktoksearch?apikey=GataDios&query=${encodeURIComponent(text)}`);
            const searchJson = await searchRes.json();

            if (!searchJson.result || !searchJson.result[0]) {
                throw new Error('No encontré resultados para esa búsqueda.');
            }

            // Obtenemos el link del primer resultado
            const videoUrl = searchJson.result[0].link; 

            // 2. Descarga sin marca de agua
            // Probamos con un servidor más robusto para evitar el error de "link function"
            const downloadRes = await fetch(`https://api.gtatutoriales.top/api/v1/tiktok?url=${videoUrl}`);
            const downloadJson = await downloadRes.json();

            // Validamos que el enlace de descarga exista y sea un texto
            const finalVideo = downloadJson.result?.video?.no_watermark || downloadJson.result?.url;

            if (!finalVideo || typeof finalVideo !== 'string') {
                throw new Error('El servidor entregó un formato incompatible. Intenta con otra búsqueda.');
            }

            let caption = `亗 *TIKTOK DOWNLOADER* 亗\n\n`;
            caption += `📝 *Título:* ${downloadJson.result?.title || text}\n`;
            caption += `👤 *Usuario:* ${downloadJson.result?.author?.nickname || 'TikToker'}\n\n`;
            caption += `> ⚙️ *Descargado con éxito sin marca de agua.*`;

            await client.sendMessage(m.chat, { 
                video: { url: finalVideo }, 
                caption: caption
            }, { quoted: m });

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error(e);
            m.reply(`❌ *FALLO:* ${e.message}`);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        }
    }
};
