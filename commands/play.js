/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: V3 Triple Respaldo (Anti-HTML & Anti-Saturación)
*/

import fetch from 'node-fetch';

export default {
    command: ['play', 'musica'],
    alias: ['p'],
    run: async (client, m, { text }) => {
        if (!text) return m.reply('音乐 *Por favor, indica el nombre de la canción.*');

        try {
            await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            // LISTA DE SERVIDORES DE ALTA DISPONIBILIDAD
            const servers = [
                {
                    name: 'Evogb Premium',
                    url: `https://api.evogb.org/api/v1/ytplay?query=${encodeURIComponent(text)}&key=evogb-zrJLlAnF`,
                    path: (d) => d.result?.download
                },
                {
                    name: 'LolHuman',
                    url: `https://api.lolhuman.xyz/api/ytplay?apikey=GataDios&query=${encodeURIComponent(text)}`,
                    path: (d) => d.result?.audio || d.result?.link
                },
                {
                    name: 'GataBot API',
                    url: `https://api.gtatutoriales.top/api/v1/ytplay?query=${encodeURIComponent(text)}`,
                    path: (d) => d.result?.downloadUrl
                }
            ];

            let audioUrl = null;
            let successServer = '';

            for (const server of servers) {
                try {
                    console.log(`[PLAY] Intentando con: ${server.name}`);
                    const response = await fetch(server.url);
                    const contentType = response.headers.get('content-type');

                    // Si no es JSON (es HTML), saltamos de inmediato
                    if (!contentType || !contentType.includes('application/json')) continue;

                    const json = await response.json();
                    audioUrl = server.path(json);

                    if (audioUrl) {
                        successServer = server.name;
                        break;
                    }
                } catch (err) {
                    console.error(`[ERROR ${server.name}]:`, err.message);
                    continue; 
                }
            }

            if (!audioUrl) {
                throw new Error('Servidores saturados (Error 503/HTML). Intenta en unos minutos.');
            }

            await client.sendMessage(m.chat, { 
                audio: { url: audioUrl }, 
                mimetype: 'audio/mpeg',
                fileName: `${text}.mp3`
            }, { quoted: m });

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            m.reply(`❌ *FALLO:* ${e.message}\n\n> Tip: Si el error persiste, la API de YouTube está bloqueando peticiones temporales.`);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        }
    }
};
