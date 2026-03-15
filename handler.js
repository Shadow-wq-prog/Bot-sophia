import seeCommands from './lib/system/commandLoader.js';
import chalk from 'chalk';

seeCommands();

export default async (client, m) => {
    if (!m?.message) return;

    const sender = m.sender.split(':')[0] + '@s.whatsapp.net';
    // AQUÍ TU NÚMERO (Owner absoluto por si falla la DB)
    const myNumber = '51983564381@s.whatsapp.net'; 
    const isVotOwn = sender === myNumber;

    let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || '';
    const prefix = '¥';

    if (!body.startsWith(prefix)) return;

    const args = body.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const text = args.join(' ');

    const cmdData = global.comandos.get(command) || [...global.comandos.values()].find(c => c.alias && c.alias.includes(command));
    if (!cmdData) return;

    // Validación de Owner simplificada para que NO te bloquee
    if (cmdData.isOwner && !isVotOwn) {
        return m.reply(`❌ Solo el desarrollador puede usar este comando.`);
    }

    try {
        console.log(chalk.green(`[ CMD ] → ${prefix}${command} | Usuario: ${sender}`));
        // Pasamos los datos directos sin depender de objetos complejos que puedan fallar
        await cmdData.run(client, m, { args, text, command, prefix, isVotOwn });
    } catch (e) {
        console.error(e);
        m.reply(`⚠️ Error: ${e.message}`);
    }
};
