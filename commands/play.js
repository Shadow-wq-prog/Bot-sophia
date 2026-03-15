/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Adaptado para: EVO-GB API
*/
import fetch from 'node-fetch';

export default {
    command: ['play', 'musica'],
    alias: ['p'],
    run: async (client, m, { text }) => {
        // Usamos 'text' que viene del handler unido
        if (!text) return m.reply('音乐 *Por favor, indica el nombre de la canción.*');

        try {
            await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            // TU CONFIGURACIÓN DE EVO-GB
            const api_key = 'TU_KEY_AQUÍ'; // Pon tu Key real aquí si no está global
            const url = `https://evogb.xyz/api/v1/ytplay?query=${encodeURIComponent(text)}&key=${api_key}`;

            const res = await fetch(url);
            const json = await res.json();

            // Validación de respuesta según EVO-GB
            if (!json.result || !json.result.download) {
                throw new Error('No se encontró el archivo o la API falló');
            }

            const { title, download, thumbnail, duration } = json.result;

            // Enviamos la información visual primero (opcional)
            let info = `亗 *𝐌𝐔𝐒𝐈𝐂𝐀𝐑𝐓 𝐏𝐋𝐀𝐘*\n\n`;
            info += `📌 *Título:* ${title}\n`;
            info += `⏱️ *Duración:* ${duration}\n`;
            info += `\n> ✨ *Enviando audio, espera un momento...*`;

            await client.sendMessage(m.chat, { 
                image: { url: thumbnail }, 
                caption: info 
            }, { quoted: m });

            // Envío del Audio
            await client.sendMessage(m.chat, { 
                audio: { url: download }, 
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`
            }, { quoted: m });

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error(e);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            m.reply(`❌ *ERROR:* No se pudo obtener la música. Verifica tu API Key o intenta más tarde.`);
        }
    }
};
