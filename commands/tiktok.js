/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: V2 (Corrección de error de Path + Búsqueda)
*/

import fetch from 'node-fetch';

export default {
    command: ['tiktok', 'tk', 'tt'],
    alias: ['tiktoks'],
    run: async (client, m, { text, prefix, command }) => {
        if (!text) return m.reply(`✨ *¿Qué buscas en TikTok?*\n\nEjemplo: *${prefix + command} Messi edit*`);

        try {
            await client.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

            // 1. Buscamos el video
            const searchRes = await fetch(`https://api.lolhuman.xyz/api/tiktoksearch?apikey=GataDios&query=${encodeURIComponent(text)}`);
            const searchJson = await searchRes.json();

            if (!searchJson.result || !searchJson.result[0]) {
                throw new Error('No encontré resultados para esa búsqueda.');
            }

            // Extraemos el enlace del primer video encontrado
            const videoUrl = searchJson.result[0].link; 

            // 2. Obtenemos el video sin marca de agua
            const downloadRes = await fetch(`https://api.lolhuman.xyz/api/tiktok?apikey=GataDios&url=${videoUrl}`);
            const downloadJson = await downloadRes.json();

            // REVISIÓN CRÍTICA: Aseguramos que 'link' sea un texto (URL) y no otra cosa
            const finalVideo = downloadJson.result?.link || downloadJson.result?.wm;

            if (!finalVideo || typeof finalVideo !== 'string') {
                throw new Error('El servidor entregó un formato de enlace inválido.');
            }

            let caption = `亗 *TIKTOK DOWNLOADER* 亗\n\n`;
            caption += `📝 *Título:* ${downloadJson.result?.title || text}\n`;
            caption += `👤 *Usuario:* ${downloadJson.result?.nickname || 'TikTok User'}\n\n`;
            caption += `> ⚙️ *Enviando contenido sin marca de agua...*`;

            // Enviamos el video asegurando que sea la URL directa
            await client.sendMessage(m.chat, { 
                video: { url: finalVideo }, 
                caption: caption
            }, { quoted: m });

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error(e);
            m.reply(`❌ *FALLO:* ${e.message}\n> Intenta con otra búsqueda si el error persiste.`);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        }
    }
};
