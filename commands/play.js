/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: Multi-Server (Anti-Error HTML)
*/

import fetch from 'node-fetch';

export default {
    command: ['play', 'musica'],
    alias: ['p'],
    run: async (client, m, { text }) => {
        if (!text) return m.reply('音乐 *Indica el nombre de la canción.*');

        try {
            await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            // CONFIGURACIÓN DE SERVIDORES
            const servers = [
                {
                    name: 'Evogb (Principal)',
                    url: `https://api.evogb.org/api/v1/ytplay?query=${encodeURIComponent(text)}&key=evogb-zrJLlAnF`,
                    map: (data) => data.result.download
                },
                {
                    name: 'LolHuman (Respaldo)',
                    url: `https://api.lolhuman.xyz/api/ytplay?apikey=GataDios&query=${encodeURIComponent(text)}`,
                    map: (data) => data.result.audio
                }
            ];

            let audioUrl = null;
            let finalTitle = text;

            for (const server of servers) {
                try {
                    console.log(`Intentando con ${server.name}...`);
                    const res = await fetch(server.url);
                    const textRes = await res.text();

                    // Si el servidor responde con HTML (error), saltamos al siguiente
                    if (textRes.includes('<!DOCTYPE html>')) continue;

                    const json = JSON.parse(textRes);
                    audioUrl = server.map(json);
                    
                    if (audioUrl) {
                        if (json.result.title) finalTitle = json.result.title;
                        break; // Éxito, salimos del bucle
                    }
                } catch (err) {
                    continue; // Error en este servidor, probar siguiente
                }
            }

            if (!audioUrl) throw new Error('Todos los servidores de música están caídos. Intenta más tarde.');

            await client.sendMessage(m.chat, { 
                audio: { url: audioUrl }, 
                mimetype: 'audio/mpeg',
                fileName: `${finalTitle}.mp3`
            }, { quoted: m });

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error(e);
            m.reply(`❌ *FALLO CRÍTICO:* ${e.message}`);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        }
    }
};
