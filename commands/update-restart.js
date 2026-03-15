/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: Reforzada con Auto-Aviso Post-Reinicio
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
      await client.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

      // 1. Guardar el chat actual para avisar al volver
      const selfId = client.user.id.split(':')[0] + "@s.whatsapp.net";
      if (global.db && global.db.data) {
        if (!global.db.data.settings) global.db.data.settings = {};
        if (!global.db.data.settings[selfId]) global.db.data.settings[selfId] = {};
        
        // Marcamos este chat como el destino del aviso
        global.db.data.settings[selfId].lastChatRestart = m.chat;
        
        if (typeof global.db.write === 'function') await global.db.write();
      }

      // 2. Lógica de Git
      await execPromise('git fetch origin')
      const { stdout: branch } = await execPromise('git rev-parse --abbrev-ref HEAD')
      const currentBranch = branch.trim()
      const { stdout: local } = await execPromise('git rev-parse HEAD')
      const { stdout: remote } = await execPromise(`git rev-parse origin/${currentBranch}`)

      if (local.trim() === remote.trim()) {
          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
          return m.reply('✨ *SISTEMA:* Ya estás actualizado. No hace falta reiniciar.')
      }

      // 3. Descargar cambios
      const { stdout: diffStatus } = await execPromise(`git diff --name-status HEAD..origin/${currentBranch}`)
      const { stdout: info } = await execPromise(`git log HEAD..origin/${currentBranch} --format="%an" -1`)
      
      await execPromise(`git reset --hard origin/${currentBranch}`)

      const lines = diffStatus.trim().split('\n').filter(l => l)
      let msg = `❀ *ACTUALIZACIÓN DESCARGADA*\n\n`
      msg += `亗 *Editor:* ${info.trim()}\n`
      msg += `✎ *Archivos:* ${lines.length}\n\n`
      msg += `> ⚙️ *Reiniciando... Te avisaré por aquí en cuanto esté en línea.*`

      await client.sendMessage(m.chat, { text: msg }, { quoted: m })
      await client.sendMessage(m.chat, { react: { text: '🚀', key: m.key } })

      // 4. Reinicio con retraso para asegurar envío
      setTimeout(() => { process.exit(0) }, 3000)

    } catch (error) {
      console.error(error)
      m.reply(`*⚠️ ERROR:* ${error.message}`)
    }
  }
}
