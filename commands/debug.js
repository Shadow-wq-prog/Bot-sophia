/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Adaptado para: Shadow-wq-prog (Bot-sophia)
*/

import fs from 'fs'
import path from 'path'
import { parse } from '@babel/parser'
import chalk from 'chalk'

export default {
  command: ['error', 'debug', 'check'],
  category: 'system',
  isOwner: true, // Solo tú, Shadow, puedes usarlo
  run: async (client, m) => {
    // Escaneamos las carpetas principales donde sueles poner código
    const targetDirs = [
      path.join(process.cwd(), 'commands'),
      path.join(process.cwd(), 'plugins'),
      path.join(process.cwd(), 'lib')
    ]

    const { key } = await client.sendMessage(m.chat, { text: '*🔍 Analizando código en busca de fallos...*' })

    const getFilesRecursively = (dir) => {
      if (!fs.existsSync(dir)) return []
      let results = []
      const list = fs.readdirSync(dir)
      list.forEach(file => {
        const filePath = path.join(dir, file)
        if (fs.statSync(filePath).isDirectory()) {
          results = results.concat(getFilesRecursively(filePath))
        } else if (file.endsWith('.js')) {
          results.push(filePath)
        }
      })
      return results
    }

    let allFiles = []
    targetDirs.forEach(dir => {
      allFiles = allFiles.concat(getFilesRecursively(dir))
    })

    let errorsFound = []

    for (const filePath of allFiles) {
      const fileName = path.relative(process.cwd(), filePath)
      const code = fs.readFileSync(filePath, 'utf-8')

      try {
        parse(code, {
          sourceType: 'module',
          plugins: ['topLevelAwait', 'estree']
        })
      } catch (e) {
        errorsFound.push({
          file: fileName,
          message: e.message,
          line: e.loc?.line,
          column: e.loc?.column
        })
      }
    }

    if (errorsFound.length === 0) {
      return await client.sendMessage(m.chat, {
        text: `✅ *SINTAXIS LIMPIA*\n\nSe revisaron *${allFiles.length}* archivos y todo está en orden. ¡Buen trabajo, Shadow!`,
        edit: key
      })
    } else {
      let reportMsg = `⚠️ *ERRORES ENCONTRADOS (${errorsFound.length})*\n\n`
      errorsFound.slice(0, 5).forEach((err, i) => {
        reportMsg += `*${i + 1}.* \`${err.file}\`\nLínea ${err.line}:${err.column}\n> ${err.message}\n`
        reportMsg += `—`.repeat(10) + `\n`
      })

      let fullTxt = `REPORTE TÉCNICO DE ERRORES - BOT SOPHIA\n${'='.repeat(35)}\n\n`
      errorsFound.forEach((err, i) => {
        fullTxt += `[${i+1}] ARCHIVO: ${err.file}\nPOSICIÓN: Línea ${err.line}, Columna ${err.column}\nERROR: ${err.message}\n\n`
      })

      if (errorsFound.length > 5) reportMsg += `\n... y ${errorsFound.length - 5} más en el archivo adjunto.`

      await client.sendMessage(m.chat, { text: reportMsg, edit: key })
      await client.sendMessage(m.chat, {
        document: Buffer.from(fullTxt),
        fileName: `debug_sophia_${Date.now()}.txt`,
        mimetype: 'text/plain'
      }, { quoted: m })
    }
  }
}
