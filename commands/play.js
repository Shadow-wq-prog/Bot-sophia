import fetch from 'node-fetch';

export default {
    command: ['play', 'musica'],
    alias: ['p'],
    run: async (client, m, { text }) => {
        if (!text) return m.reply('音乐 *Por favor, indica el nombre de la canción.*');

        try {
            await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            // URL ACTUALIZADA A .ORG
            const api_key = 'evogb-zrJLlAnF'; 
            const url = `https://api.evogb.org/api/v1/ytplay?query=${encodeURIComponent(text)}&key=${api_key}`;

            const res = await fetch(url);
            
            // Si la respuesta no es JSON, capturamos el error aquí
            const textData = await res.text();
            let json;
            try {
                json = JSON.parse(textData);
            } catch (e) {
                throw new Error('La API respondió con un error de servidor (HTML). Intenta más tarde.');
            }

            if (!json.result || !json.result.download) {
                throw new Error('No se encontró el archivo o la Key no tiene saldo.');
            }

            await client.sendMessage(m.chat, { 
                audio: { url: json.result.download }, 
                mimetype: 'audio/mpeg',
                fileName: `${json.result.title}.mp3`
            }, { quoted: m });

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error(e);
            m.reply(`❌ *ERROR:* ${e.message}`);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        }
    }
};
