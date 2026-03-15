/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: V6 (Triple API de Respaldo + Limpieza de Buffer)
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

            if (!searchJson.result || !searchJson.result[0]) throw new Error('No encontré resultados.');

            const videoUrl = searchJson.result[0].link; 
            let finalVideo = null;

            // 2. SISTEMA DE RESPALDO (Probamos 3 fuentes antes de rendirnos)
            const apis = [
                `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(videoUrl)}`,
                `https://api.botcahx.eu.org/api/dowloader/tiktok?url=${encodeURIComponent(videoUrl)}&apikey=Admin`,
                `https://deliriussapi-official.vercel.app/download/tiktokdl?url=${encodeURIComponent(videoUrl)}`
            ];

            for (const api of apis) {
                try {
                    const res = await fetch(api);
                    const contentType = res.headers.get('content-type');
                    
                    // Si no es JSON real, saltamos al siguiente servidor
                    if (!contentType || !contentType.includes('application/json')) continue;

                    const json = await res.json();
                    const link = json.video?.noWatermark || json.result?.video?.no_watermark || json.data?.nowm || json.result?.link;

                    if (link && typeof link === 'string') {
                        finalVideo = link;
                        break; 
                    }
                } catch (e) { continue; }
            }

            if (!finalVideo) throw new Error('Todos los servidores están saturados (HTML Error).');

            await client.sendMessage(m.chat, { 
                video: { url: finalVideo }, 
                caption: `亗 *TIKTOK SEARCH* 亗\n\n> ✅ Video obtenido sin marca de agua.`
            }, { quoted: m });

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            m.reply(`❌ *FALLO:* ${e.message}\n> Tip: Reintenta en 5 segundos, los servidores suelen liberarse rápido.`);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        }
    }
};
