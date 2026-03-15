import fetch from 'node-fetch';

export default {
    command: ['play', 'musica'],
    alias: ['p'],
    run: async (client, m, { text }) => {
        if (!text) return m.reply('音乐 *Por favor, indica el nombre de la canción.*');

        try {
            await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            // NUEVA URL DE LA API SEGÚN TU NAVEGADOR
            const api_key = 'evogb-zrJLlAnF'; 
            const url = `https://api.evogb.org/api/v1/ytplay?query=${encodeURIComponent(text)}&key=${api_key}`;

            const res = await fetch(url);
            const json = await res.json();

            if (!json.result || !json.result.download) {
                throw new Error('No se encontró el archivo. Verifica tu saldo o la Key.');
            }

            const { title, download } = json.result;

            await client.sendMessage(m.chat, { 
                audio: { url: download }, 
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`
            }, { quoted: m });

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error(e);
            m.reply(`❌ *ERROR:* ${e.message}`);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        }
    }
};
