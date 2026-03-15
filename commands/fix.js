/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗

https://chat.whatsapp.com/IyxuHbUdgvYBcVit6sThOO
*/

import { exec } from 'child_process'
import { promisify } from 'util'
import loadCommandsAndPlugins from '../../lib/system/commandLoader.js' 

const execPromise = promisify(exec)

export default {
  command: ['fix', 'update'],
  isOwner: true,
  run: async (client, m) => {
    try {
      await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

      await execPromise('git fetch origin main')

      const { stdout: local } = await execPromise('git rev-parse HEAD')
      const { stdout: remote } = await execPromise('git rev-parse origin/main')

      if (local.trim() === remote.trim()) {
          global.comandos.clear()
          await loadCommandsAndPlugins()
          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
          return m.reply('ꕥ El bot ya está en su última versión. Comandos refrescados.')
      }

      const { stdout: info } = await execPromise('git log HEAD..origin/main --format="%an" -1')
      const { stdout: filesChanged } = await execPromise('git diff --name-only HEAD..origin/main')

      await execPromise('git reset --hard origin/main')

      global.comandos.clear()
      global.plugins = {}
      if (global.middlewares) {
          global.middlewares.before = []
          global.middlewares.after = []
      }

      await loadCommandsAndPlugins() 

      const fileList = filesChanged.trim().split('\n').filter(f => f).map(f => `• ${f}`).slice(0, 15).join('\n')
      const totalFiles = filesChanged.trim().split('\n').length

      let msg = `_亗 Actualización Exitosa_\n`
      msg += `*Usuario:* ${info.trim()}\n`
      msg += `*Archivos:* ${totalFiles}\n\n`
      msg += `*✎ Detalles:*\n${fileList}${totalFiles > 15 ? '\n...entre otros.' : ''}`

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
      await client.sendMessage(m.chat, { text: msg }, { quoted: m })

    } catch (error) {
      console.error(error)
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      await m.reply(`*❌ ERROR:* ${error.message}`)
    }
  }
}