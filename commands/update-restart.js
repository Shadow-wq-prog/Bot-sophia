/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Adaptado para: Shadow-wq-prog (Bot-sophia)
*/

import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk' 

const execPromise = promisify(exec)

export default {
  command: ['rfix', 'actualizar', 'fix'], 
  isOwner: true, 
  run: async (client, m) => {
    try {
      // Reacción de espera
      await client.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

      // 1. CONFIGURACIÓN DE GIT
      await execPromise('git config user.email "bot@host.com"')
      await execPromise('git config user.name "HostBot"')
      
      // 2. BUSCAR ACTUALIZACIONES
      await execPromise('git fetch origin')
      const { stdout: branch } = await execPromise('git rev-parse --abbrev-ref HEAD')
      const currentBranch = branch.trim()

      // Verificar qué archivos cambiaron
      const { stdout: diffStatus } = await execPromise(`git diff --name-status HEAD..origin/${currentBranch}`).catch(() => ({ stdout: '' }))
      const { stdout: info } = await execPromise(`git log HEAD..origin/${currentBranch} --format="%an" -1`).catch(() => ({ stdout: 'Desconocido' }))

      const lines = diffStatus.trim().split('\n').filter(line => line.trim() !== '')
      const totalFiles = lines.length

      // 3. APLICAR CAMBIOS (Reset hard para limpiar errores locales)
      await execPromise(`git reset --hard origin/${currentBranch}`)

      // Preparar lista de archivos para el mensaje
      let changeList = lines.map(line => {
        const [status, ...fileParts] = line.split(/\s+/)
        const file = fileParts.join(' ')
        switch (status) {
          case 'A': return `+ ${file}`
          case 'M': return `• ${file}`
          case 'D': return `- ${file}`
          default: return `? ${file}`
        }
      }).slice(0, 20).join('\n')

      let msg = `❀ *ACTUALIZACIÓN EXITOSA*\n\n`
      msg += `亗 *Editor:* ${info.trim()}\n`
      msg += `✎ *Total Cambios:* ${totalFiles}\n\n`

      if (totalFiles > 0) {
          msg += `ꕥ *Archivos actualizados:*\n\`\`\`${changeList}${totalFiles > 20 ? '\n...entre otros.' : ''}\`\`\`\n\n`
      } else {
          msg += `> *El bot ya está en su última versión.*\n\n`
      }

      msg += `> ⚙️ *Reiniciando sistema...* Por favor espera.`

      // 4. GUARDAR CONTEXTO PARA EL AVISO AL VOLVER
      // Guardamos el ID del chat en la base de datos global
      if (global.db && global.db.data) {
        global.db.data.lastChat = m.chat; 
        await global.db.write(); // Forzamos el guardado en el JSON
      }

      await client.sendMessage(m.chat, { text: msg }, { quoted: m })
      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

      console.log(chalk.greenBright(`✅ Sistema actualizado. Guardando chat ${m.chat} y reiniciando...`)) 

      // 5. REINICIO FINAL
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
