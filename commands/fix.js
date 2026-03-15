/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: Definitiva Anti-Rutas
*/

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execPromise = promisify(exec)

export default {
  command: ['fix', 'update'],
  isOwner: true,
  run: async (client, m) => {
    try {
      // Importación dinámica para evitar errores de ruta relativa
      const loaderPath = path.join(process.cwd(), 'lib/system/commandLoader.js')
      const { default: loadCommandsAndPlugins } = await import(`file://${loaderPath}?update=${Date.now()}`)

      await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

      // 1. Verificar actualizaciones en GitHub
      await execPromise('git fetch origin main')

      const { stdout: local } = await execPromise('git rev-parse HEAD')
      const { stdout: remote } = await execPromise('git rev-parse origin/main')

      // 2. Si ya está actualizado, solo refrescamos comandos
      if (local.trim() === remote.trim()) {
          if (global.comandos) global.comandos.clear()
          await loadCommandsAndPlugins()
          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
          return m.reply('✨ *亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗:* El bot ya está actualizado. Comandos refrescados con éxito.')
      }

      // 3. Si hay cambios, descargar y resetear
      const { stdout: info } = await execPromise('git log HEAD..origin/main --format="%an" -1')
      const { stdout: filesChanged } = await execPromise('git diff --name-only HEAD..origin/main')

      await execPromise('git reset --hard origin/main')

      // Limpiar caché de comandos y plugins
      if (global.comandos) global.comandos.clear()
      global.plugins = {}
      
      // Recargar todo el sistema
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
      await m.reply(`*❌ ERROR CRÍTICO:* ${error.message}`)
    }
  }
}
