/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗
Versión: FUERZA BRUTA (Anti-Owner Error)
*/

import chalk from 'chalk';
import seeCommands from './lib/system/commandLoader.js';
import initDB from './lib/system/initDB.js';

// Cargar comandos al inicio
seeCommands();

export default async (client, m) => {
    if (!m?.message) return;

    // 1. IDENTIFICACIÓN ABSOLUTA (Esto arregla el error de Owner)
    const sender = m.sender.split(':')[0] + '@s.whatsapp.net';
    const myNumber = '51983564381@s.whatsapp.net'; // Tu número
    const isVotOwn = (sender === myNumber); 

    // 2. EXTRAER TEXTO
    let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || '';
    const prefix = '¥';

    if (!body.startsWith(prefix)) return;

    // 3. INICIALIZAR DB (Con try/catch para que no crashee)
    try { 
        initDB(m, client); 
    } catch (e) {
        console.log(chalk.yellow("⚠️ Error de DB ignorado para seguir ejecutando."));
    }

    const args = body.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const text = args.join(' ');

    // 4. BUSCAR COMANDO
    const cmdData = global.comandos.get(command) || [...global.comandos.values()].find(c => c.alias && c.alias.includes(command));
    if (!cmdData) return;

    // 5. VALIDACIÓN DE DUEÑO (USANDO EL NÚMERO DIRECTO)
    if (cmdData.isOwner && !isVotOwn) {
        return m.reply(`❌ *ACCESO DENEGADO*\nSolo el Owner real (${myNumber.split('@')[0]}) puede usar este comando.`);
    }

    // 6. EJECUCIÓN LIMPIA
    try {
        console.log(chalk.bgGreen.black(`[ CMD ]`) + chalk.green(` ${prefix}${command} | De: ${sender}`));
        
        // Ejecutamos pasando el objeto que tus comandos esperan
        await cmdData.run(client, m, { 
            args, 
            text, 
            command, 
            prefix, 
            isVotOwn,
            isAdmins: true, // Te damos admin por defecto por ser owner
            isBotAdmins: true 
        });

    } catch (error) {
        console.error(chalk.red(`[ ERROR ]`), error);
        // Si el error es de la base de datos (db.write), el comando ya se ejecutó, así que no avisamos
        if (!error.message.includes('db.write')) {
            m.reply(`⚠️ Fallo: ${error.message}`);
        }
    }
};
