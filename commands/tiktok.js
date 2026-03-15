/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: V4 (Blindaje Anti-HTML y Multi-API)
*/

import fetch from 'node-fetch';

export default {
    command: ['tiktok', 'tk', 'tt'],
    alias: ['tiktoks'],
    run: async (client, m, { text, prefix, command }) => {
        if (!text) return m.reply(`✨ *¿Qué buscas en TikTok?*\n\nEjemplo: *${prefix + command} Messi edit*`);

        try {
            await client.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

            // 1. Buscamos el video (Usamos una API de búsqueda estable)
            const searchRes = await fetch(`https://api.lolhuman.xyz/api/tiktoksearch?apikey=GataDios&query=${encodeURIComponent(text)}`);
            const searchJson = await searchRes.json();

            if (!searchJson.result || !searchJson.result[0]) {
                throw new Error('No encontré resultados para esa búsqueda.');
            }

            const videoUrl = searchJson.result[0].link; 
            let finalVideo = null;

            // 2. Intentamos descargar con 2 métodos diferentes (Sistema de Respaldo)
            const downloadApis = [
                `https://api.lolhuman.xyz/api/tiktok?apikey=GataDios&url=${videoUrl}`,
                `https://api.botcahx.eu.org/api/dowloader/tiktok?url=${videoUrl}&apikey=Admin`
            ];

            for (const api of downloadApis) {
                try {
                    const res = await fetch(api);
                    const json = await res.json();
                    
                    // Verificamos que el resultado sea un String (URL) y no una función
                    const link = json.result?.link || json.result?.video?.no_watermark || json.result?.video;
                    if (link && typeof link === 'string' && link.startsWith('http')) {
                        finalVideo = link;
                        break;
                    }
                } catch (e) {
                    continue; // Si una falla, pasamos a la siguiente
                }
            }

            if (!finalVideo) {
                throw new Error('Los servidores de descarga están saturados. Intenta en un momento.');
            }

            await client.sendMessage(m.chat, { 
                video: { url: finalVideo }, 
                caption: `亗 *TIKTOK DOWNLOADER* 亗\n\n> ✅ Video encontrado y procesado sin marca de agua.`
            }, { quoted: m });

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error(e);
            m.reply(`❌ *FALLO:* ${e.message}`);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        }
    }
};
