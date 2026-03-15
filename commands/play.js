/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Optimizado para: Shadow-wq-prog (Bot-sophia)
*/

import fetch from 'node-fetch'

export default {
  command: ['play', 'mp3', 'ytmp3'],
  category: 'downloads',
  run: async (client, m, { text }) => {
    if (!text) return m.reply('《✧》Por favor, indica el nombre de la canción.')

    await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    try {
      // Usamos la URL completa y la key que ya tienes configurada
      const api_key = 'evogb-zrJLIAnF' 
      const apiUrl = `https://api.evogb.org/dl/youtubeplay?query=${encodeURIComponent(text)}&apikey=${api_key}`

      const response = await fetch(apiUrl)
      const res = await response.json()

      // Si la API responde con error o no hay datos
      if (!res.status || !res.data) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        return m.reply('《✧》 La API no devolvió resultados. Intenta con otro nombre.')
      }

      const { title, thumbnail, download } = res.data

      // 1. Enviamos la imagen con el título
      await client.sendMessage(m.chat, { 
        image: { url: thumbnail }, 
        caption: `✅ *Título:* ${title}\n\n𐙚 _Descargando audio, espera..._` 
      }, { quoted: m })

      // 2. Enviamos el audio (usamos el enlace directo de descarga)
      await client.sendMessage(m.chat, { 
        audio: { url: download.url }, 
        fileName: `${title}.mp3`, 
        mimetype: 'audio/mpeg' 
      }, { quoted: m })

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

    } catch (e) {
      console.error(e)
      // Si el error persiste, es probable que la IP de tu hosting esté bloqueada por la API
      await m.reply("《✧》 Error al conectar con Evogb. Verifica si tu API Key sigue activa en el dashboard.")
    }
  }
}
