/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: V5 (Fuerza Bruta - Anti-Saturación)
*/

import fetch from 'node-fetch';

export default {
    command: ['tiktok', 'tk', 'tt'],
    alias: ['tiktoks'],
    run: async (client, m, { text, prefix, command }) => {
        if (!text) return m.reply(`✨ *¿Qué buscas en TikTok?*\n\nEjemplo: *${prefix + command} Messi edit*`);

        try {
            await client.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

            // 1. Búsqueda con un servidor alternativo más estable
            const searchUrl = `https://api.tikhub.io/v1/tiktok/search?keyword=${encodeURIComponent(text)}`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            // Si falla la búsqueda anterior, usamos la de respaldo que ya conocemos
            let videoUrl = searchData?.data?.videos?.[0]?.video_id 
                ? `https://www.tiktok.com/@user/video/${searchData.data.videos[0].video_id}`
                : null;

            if (!videoUrl) {
                const backupSearch = await fetch(`https://api.lolhuman.xyz/api/tiktoksearch?apikey=GataDios&query=${encodeURIComponent(text)}`);
                const backupJson = await backupSearch.json();
                videoUrl = backupJson.result?.[0]?.link;
            }

            if (!videoUrl) throw new Error('No encontré resultados. Intenta con palabras más simples.');

            await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            // 2. Descarga usando una API de "limpieza" para asegurar que sea un String
            const downloadUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(videoUrl)}`;
            const dlRes = await fetch(downloadUrl);
            const dlData = await dlRes.json();

            // Extraemos el link asegurando que sea texto puro
            const finalVideo = dlData.video?.noWatermark || dlData.video?.url || dlData.result?.video;

            if (!finalVideo || typeof finalVideo !== 'string') {
                throw new Error('El video está protegido o el servidor de descarga falló.');
            }

            let caption = `亗 *TIKTOK SEARCH* 亗\n\n`;
            caption += `📝 *Título:* ${dlData.video?.title || text}\n`;
            caption += `👤 *Autor:* ${dlData.author?.nickname || 'TikTok User'}\n\n`;
            caption += `> ✅ *Video procesado con éxito.*`;

            await client.sendMessage(m.chat, { 
                video: { url: finalVideo }, 
                caption: caption
            }, { quoted: m });

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error(e);
            m.reply(`❌ *FALLO:* ${e.message}\n\n> Intenta de nuevo, a veces los servidores se liberan en segundos.`);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        }
    }
};
