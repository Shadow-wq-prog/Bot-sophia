/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Adaptado para: Shadow-wq-prog (Bot-sophia)
*/

import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync } from 'fs' 
import path from 'path' 
import chalk from 'chalk' 

const execPromise = promisify(exec)

export default {
  command: ['rfix', 'actualizar'], // Responde a ¥update o ¥fix
  isOwner: true, // Solo tú (Shadow) puedes usarlo
  run: async (client, m) => {
    try {
      // Reacción de espera
      await client.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

      // Configuración rápida de Git para evitar errores de permisos
      await execPromise('git config user.email "bot@host.com"')
      await execPromise('git config user.name "HostBot"')
      
      // Sincronizar con GitHub
      await execPromise('git fetch origin')

      const { stdout: branch } = await execPromise('git rev-parse --abbrev-ref HEAD')
      const currentBranch = branch.trim()

      // Verificar cambios
      const { stdout: diffStatus } = await execPromise(`git diff --name-status HEAD..origin/${currentBranch}`).catch(() => ({ stdout: '' }))
      const { stdout: info } = await execPromise(`git log HEAD..origin/${currentBranch} --format="%an" -1`).catch(() => ({ stdout: 'Desconocido' }))

      const lines = diffStatus.trim().split('\n').filter(line => line.trim() !== '')
      const totalFiles = lines.length

      // APLICAR CAMBIOS (ESTO BORRA ERRORES LOCALES)
      await execPromise(`git reset --hard origin/${currentBranch}`)

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

      msg += `> *Reiniciando sistema...*`

      await client.sendMessage(m.chat, { text: msg }, { quoted: m })
      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

      console.log(chalk.greenBright(`✅ Actualizado por comando, reiniciando.`)) 

      // Guardar base de datos antes de morir
      if (global.db && global.db.write) await global.db.write()

      // El bucle "while" de tu terminal lo encenderá de nuevo
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
