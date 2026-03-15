/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: Logs Prioritarios + Anti-Crasheo Absoluto
*/

import chalk from 'chalk';
import seeCommands from './lib/system/commandLoader.js';
import initDB from './lib/system/initDB.js';

// Cargar comandos al iniciar el bot
seeCommands();

export default async (client, m) => {
    if (!m?.message) return;

    // 1. IDENTIFICACIÓN Y TEXTO
    const sender = m.sender.split(':')[0] + '@s.whatsapp.net';
    const myNumber = '51983564381@s.whatsapp.net'; 
    const isVotOwn = (sender === myNumber); 

    let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || '';
    const prefix = '¥';

    // 2. LOGS DE CONSOLA INMEDIATOS (Para ver qué llega al bot)
    if (body.startsWith(prefix)) {
        console.log(chalk.bgCyan.black(`[ COMANDO DETECTADO ]`) + chalk.cyan(` ${body} | De: ${sender}`));
    }

    if (!body.startsWith(prefix)) return;

    // 3. SEPARAR COMANDO Y ARGUMENTOS
    const args = body.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const text = args.join(' ');

    // 4. INICIALIZAR BASE DE DATOS (Protegido)
    try { 
        initDB(m, client); 
    } catch (e) {
        console.log(chalk.red(`[ ERROR DB ]`), e.message);
    }

    // 5. BUSCAR COMANDO
    const cmdData = global.comandos.get(command) || [...global.comandos.values()].find(c => c.alias && c.alias.includes(command));
    
    if (!cmdData) {
        console.log(chalk.yellow(`[ INFO ] Comando no encontrado: ${prefix}${command}`));
        return;
    }

    // 6. VALIDACIÓN DE DUEÑO (Usando el número fijo)
    if (cmdData.isOwner && !isVotOwn) {
        console.log(chalk.red(`[ BLOQUEO ] Usuario ${sender} intentó usar comando de Owner.`));
        return m.reply(`❌ Solo el Owner puede usar este comando.`);
    }

    // 7. EJECUCIÓN DEL COMANDO
    try {
        await cmdData.run(client, m, { 
            args, 
            text, 
            command, 
            prefix, 
            isVotOwn,
            isAdmins: true, 
            isBotAdmins: true 
        });
        
        console.log(chalk.green(`[ OK ] ${prefix}${command} ejecutado con éxito.`));

    } catch (error) {
        console.error(chalk.red(`[ ERROR CRÍTICO ]`), error);
        
        // No avisar si es error de escritura de DB (el comando ya funcionó)
        if (!error.message.includes('db.write')) {
            m.reply(`⚠️ Ocurrió un error: ${error.message}`);
        }
    }
};
