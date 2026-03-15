/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: Definitiva Anti-Rutas + DB Safe
*/

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import chalk from 'chalk'

const execPromise = promisify(exec)

export default {
  command: ['fix', 'update'],
  isOwner: true,
  run: async (client, m) => {
    try {
      // Importación dinámica para evitar errores de ruta relativa al recargar
      const loaderPath = path.join(process.cwd(), 'lib/system/commandLoader.js')
      const { default: loadCommandsAndPlugins } = await import(`file://${loaderPath}?update=${Date.now()}`)

      await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

      // --- PROTECCIÓN Y GUARDADO DE BASE DE DATOS ---
      try {
        if (global.db && global.db.data) {
          // Guardamos el chat actual para que el index.js avise al volver
          global.db.data.lastChat = m.chat; 
          
          if (typeof global.db.write === 'function') {
            await global.db.write();
          } else {
            console.log(chalk.yellow("⚠️ Advertencia: global.db.write no es una función, omitiendo guardado manual."));
          }
        }
      } catch (dbErr) {
        console.error("Error al procesar DB en Fix:", dbErr);
      }

      // 1. Verificar actualizaciones en GitHub
      await execPromise('git fetch origin main')
      const { stdout: local } = await execPromise('git rev-parse HEAD')
      const { stdout: remote } = await execPromise('git rev-parse origin/main')

      // 2. Si ya está actualizado, solo refrescamos comandos en caliente
      if (local.trim() === remote.trim()) {
          if (global.comandos) global.comandos.clear()
          await loadCommandsAndPlugins()
          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
          return m.reply('✨ *亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗:* El bot ya está actualizado. Comandos refrescados con éxito.')
      }

      // 3. Si hay cambios, descargar y resetear hard
      const { stdout: info } = await execPromise('git log HEAD..origin/main --format="%an" -1')
      const { stdout: filesChanged } = await execPromise('git diff --name-only HEAD..origin/main')

      await execPromise('git reset --hard origin/main')

      // Limpiar caché de comandos y plugins para evitar conflictos de memoria
      if (global.comandos) global.comandos.clear()
      global.plugins = {}
      
      // Recargar todo el sistema de comandos
      await loadCommandsAndPlugins() 

      const fileList = filesChanged.trim().split('\n').filter(f => f).map(f => `• ${f}`).slice(0, 15).join('\n')
      const totalFiles = filesChanged.trim().split('\n').length

      let msg = `_亗 Actualización Exitosa_\n`
      msg += `*Usuario:* ${info.trim()}\n`
      msg += `*Archivos:* ${totalFiles}\n\n`
      msg += `*✎ Detalles:*\n${fileList}${totalFiles > 15 ? '\n...entre otros.' : ''}\n\n`
      msg += `> *Reiniciando caché de comandos...*`

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
      await client.sendMessage(m.chat, { text: msg }, { quoted: m })

      // Forzamos salida para que el script de arranque (Termux/Railway) lo inicie limpio
      // Esto asegura que los cambios en archivos core como handler.js surtan efecto
      setTimeout(() => {
        process.exit(0)
      }, 2000)

    } catch (error) {
      console.error(error)
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      await m.reply(`*❌ ERROR CRÍTICO EN UPDATE:* ${error.message}`)
    }
  }
}
