/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗

https://chat.whatsapp.com/IyxuHbUdgvYBcVit6sThOO
*/



import fs from "fs"
import path from "path"
import chalk from "chalk"
import { fileURLToPath, pathToFileURL } from "url"
import syntaxerror from "syntax-error"
import { format } from 'util'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

global.comandos = new Map()
global.plugins = {}
global.middlewares = { before: [], after: [] }

const commandsFolder = path.join(__dirname, "../../commands")

async function loadCommandsAndPlugins(dir = commandsFolder) {
    if (!fs.existsSync(dir)) return
    const items = fs.readdirSync(dir)

    for (const fileOrFolder of items) {
        const fullPath = path.join(dir, fileOrFolder)

        if (fs.lstatSync(fullPath).isDirectory()) {
            await loadCommandsAndPlugins(fullPath)
            continue
        }

        if (!fileOrFolder.endsWith(".js")) continue

        const code = fs.readFileSync(fullPath)
        const err = syntaxerror(code, fileOrFolder, {
            sourceType: "module",
            allowAwaitOutsideFunction: true
        })

        if (err) {
            console.error(chalk.red(`❌ Error real de sintaxis en ${fileOrFolder}:\n${format(err)}`))
            continue
        }

        try {
            const fileUrl = pathToFileURL(path.resolve(fullPath)).href
            const modulePath = `${fileUrl}?update=${Date.now()}`
            
            const imported = await import(modulePath)
            const comando = imported.default
            const pluginName = fileOrFolder.replace(".js", "")

            global.plugins[pluginName] = imported

            if (typeof imported.before === 'function') global.middlewares.before.push(imported.before)
            if (typeof imported.after === 'function') global.middlewares.after.push(imported.after)

            if (!comando?.command || typeof comando.run !== "function") continue

            comando.command.forEach(cmd => {
                global.comandos.set(cmd.toLowerCase(), {
                    pluginName,
                    run: comando.run,
                    category: comando.category || "uncategorized",
                    isOwner: comando.isOwner || false,
                    isAdmin: comando.isAdmin || false,
                    botAdmin: comando.botAdmin || false,
                    isModeration: comando.isModeration || false,
                    isMaintenance: comando.isMaintenance || false,
                    isFuture: comando.isFuture || false,
                    info: comando.info || {}
                })
            })
        } catch (e) {
            console.error(chalk.red(`❌ No se pudo cargar ${fileOrFolder}:`), e.message)
        }
    }
}

globalThis.reload = async (_ev, filename) => {
    if (!filename.endsWith(".js")) return
    global.comandos.clear()
    global.middlewares.before = []
    global.middlewares.after = []
    await loadCommandsAndPlugins()
}

fs.watch(commandsFolder, { recursive: true }, (event, filename) => {
    if (filename) globalThis.reload(event, filename)
})

export default loadCommandsAndPlugins
