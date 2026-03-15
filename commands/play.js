import fetch from 'node-fetch';

export default {
    command: ['play', 'musica'],
    run: async (client, m, { text }) => {
        if (!text) return m.reply('音乐 Por favor, indica el nombre de la canción.');
        
        try {
            await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
            
            // Usando una API alternativa más estable para pruebas
            const res = await fetch(`https://api.lolhuman.xyz/api/ytplay?apikey=GataDios&query=${encodeURIComponent(text)}`);
            const json = await res.json();

            if (json.status !== 200) throw 'Error en la API';

            await client.sendMessage(m.chat, { 
                audio: { url: json.result.link }, 
                mimetype: 'audio/mpeg',
                fileName: `${json.result.title}.mp3`
            }, { quoted: m });
            
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        } catch (e) {
            console.error(e);
            m.reply('❌ Error al buscar la canción. Intenta con otro nombre.');
        }
    }
};
