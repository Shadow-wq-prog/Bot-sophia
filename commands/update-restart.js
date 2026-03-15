/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: Definitiva (Git + DB Safe + Auto-Aviso)
*/

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import chalk from 'chalk'

const execPromise = promisify(exec)

export default {
  command: ['rfix', 'actualizar'], 
  isOwner: true, 
  run: async (client, m, { text, args }) => {
    try {
      // Reacción inicial
      await client.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

      // 1. CARGA DINÁMICA DEL LOADER (Para refrescar comandos sin morir)
      const loaderPath = path.join(process.cwd(), 'lib/system/commandLoader.js')
      const { default: loadCommands } = await import(`file://${loaderPath}?update=${Date.now()}`)

      // 2. PROTECCIÓN DE BASE DE DATOS Y AVISO
      if (global.db && global.db.data) {
        global.db.data.lastChat = m.chat; // Guardamos el chat para que el index avise al volver
        
        try {
          if (typeof global.db.write === 'function') {
            await global.db.write();
          }
        } catch (dbErr) {
          console.log(chalk.yellow("⚠️ No se pudo forzar el guardado de la DB, pero continuando..."));
        }
      }

      // 3. CONFIGURACIÓN Y BUSQUEDA EN GIT
      await execPromise('git config user.email "bot@host.com"')
      await execPromise('git config user.name "HostBot"')
      await execPromise('git fetch origin')

      const { stdout: branch } = await execPromise('git rev-parse --abbrev-ref HEAD')
      const currentBranch = branch.trim()

      const { stdout: local } = await execPromise('git rev-parse HEAD')
      const { stdout: remote } = await execPromise(`git rev-parse origin/${currentBranch}`)

      // 4. CASO A: YA ESTÁ ACTUALIZADO
      if (local.trim() === remote.trim()) {
          if (global.comandos) global.comandos.clear()
          await loadCommands()
          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
          return m.reply('✨ *SISTEMA:* El bot ya está en su última versión. Comandos refrescados correctamente.')
      }

      // 5. CASO B: HAY CAMBIOS (DESCARGAR Y REINICIAR)
      const { stdout: diffStatus } = await execPromise(`git diff --name-status HEAD..origin/${currentBranch}`).catch(() => ({ stdout: '' }))
      const { stdout: info } = await execPromise(`git log HEAD..origin/${currentBranch} --format="%an" -1`).catch(() => ({ stdout: 'Desconocido' }))

      const lines = diffStatus.trim().split('\n').filter(line => line.trim() !== '')
      const totalFiles = lines.length

      await execPromise(`git reset --hard origin/${currentBranch}`)

      // Preparar lista visual de cambios
      let changeList = lines.map(line => {
        const [status, ...fileParts] = line.split(/\s+/)
        const file = fileParts.join(' ')
        switch (status) {
          case 'A': return `+ ${file}`
          case 'M': return `• ${file}`
          case 'D': return `- ${file}`
          default: return `? ${file}`
        }
      }).slice(0, 15).join('\n')

      let msg = `❀ *ACTUALIZACIÓN EXITOSA*\n\n`
      msg += `亗 *Editor:* ${info.trim()}\n`
      msg += `✎ *Total Cambios:* ${totalFiles}\n\n`
      if (totalFiles > 0) msg += `ꕥ *Archivos:*\n\`\`\`${changeList}${totalFiles > 15 ? '\n...entre otros.' : ''}\`\`\`\n\n`
      msg += `> ⚙️ *Reiniciando sistema para aplicar cambios core...*`

      await client.sendMessage(m.chat, { text: msg }, { quoted: m })
      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

      console.log(chalk.greenBright(`✅ Actualizado y guardado chat ${m.chat}. Reiniciando proceso...`)) 

      // Reiniciamos el proceso para que los cambios en index.js o handler.js surtan efecto
      setTimeout(() => {
        process.exit(0)
      }, 3000)

    } catch (error) {
      console.error(error)
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      await m.reply(`*⚠️ FALLO EN ACTUALIZACIÓN:* \n\n${error.message}`)
    }
  }
}
