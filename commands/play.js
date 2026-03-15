import fetch from 'node-fetch';

export default {
    command: ['play', 'musica'],
    alias: ['p'],
    run: async (client, m, { text }) => {
        if (!text) return m.reply('音乐 *Indica el nombre de la canción.*');

        try {
            await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            // CAMBIA ESTO POR TU KEY REAL DE EVO-GB
            const api_key = 'evogb-zrJLIAnF'; 
            const url = `https://evogb.xyz/api/v1/ytplay?query=${encodeURIComponent(text)}&key=${api_key}`;

            const res = await fetch(url);
            
            // Si la web de EVO-GB no carga (ENOTFOUND), avisamos
            if (!res.ok) throw new Error('El servidor de la API no responde.');

            const json = await res.json();
            if (!json.result || !json.result.download) throw new Error('No se encontró el audio.');

            await client.sendMessage(m.chat, { 
                audio: { url: json.result.download }, 
                mimetype: 'audio/mpeg',
                fileName: `${json.result.title}.mp3`
            }, { quoted: m });

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        } catch (e) {
            console.error(e);
            m.reply(`❌ *Error:* ${e.message}. Verifica tu API Key.`);
        }
    }
};
