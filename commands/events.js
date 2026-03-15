import chalk from 'chalk'
import moment from 'moment-timezone'

export default async (client, m) => {
    if (!client._groupParticipantsRegistered) {
        try { client.ev.setMaxListeners(1000) } catch {}
        client.ev.on('group-participants.update', async (anu) => {
            try {
                const metadata = await client.groupMetadata(anu.id)
                const chat = global.db.data.chats[anu.id] || {}
                const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'
                const primaryBotId = chat?.primaryBot
                const dev = '亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗'

                const now = new Date()
                const colombianTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }))
                const memberCount = metadata.participants.length

                for (const p of anu.participants) {
                    const jid = p.id || p.jid || p 
                    const phone = jid.split('@')[0]
                    const pp = await client.profilePictureUrl(jid, 'image').catch(_ => 'https://cdn.stellarwa.xyz/files/1755559736781.jpeg')

                    const fakeContext = {
                        contextInfo: {
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: global.db.data.settings[botId]?.id || '',
                                serverMessageId: '0',
                                newsletterName: global.db.data.settings[botId]?.nameid || 'Masha'
                            },
                            externalAdReply: {
                                title: global.db.data.settings[botId]?.namebot || 'Masha Bot',
                                body: dev,
                                thumbnailUrl: global.db.data.settings[botId]?.icon || pp,
                                sourceUrl: global.db.data.settings[botId]?.link || '',
                                mediaType: 1,
                                renderLargerThumbnail: false
                            },
                            mentionedJid: [jid]
                        }
                    }

                    // Lógica de Bienvenida
                    if (anu.action === 'add' && chat?.welcome && (!primaryBotId || primaryBotId === botId)) {
                    const caption = `╭┈──̇─̇─̇────̇─̇─̇──◯◝\n┊「 *Bienvenido (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)* 」\n┊︶︶︶︶︶︶︶︶︶︶︶\n┊  *Usuario ›* @${phone}\n┊  *Grupo ›* ${metadata.subject}\n┊┈─────̇─̇─̇─────◯◝\n┊➤ *Usa /menu para ver los comandos.*\n┊➤ *Ahora somos ${memberCount} miembros.*\n┊ ︿︿︿︿︿︿︿︿︿︿︿\n╰─────────────────╯`
                        await client.sendMessage(anu.id, { image: { url: pp }, caption, mentions: [jid], ...fakeContext })
                    }

                    // Lógica de Despedida

/*
                    if ((anu.action === 'remove' || anu.action === 'leave') && chat?.welcome && (!primaryBotId || primaryBotId === botId)) {
                    const caption = `╭┈──̇─̇─̇────̇─̇─̇──◯◝\n┊「 *@${phone} se ha ido* 」\n┊         *(⁠╥⁠﹏⁠╥⁠)*\n┊︶︶︶︶︶︶︶︶︶︶︶\n┊➤ *Lamentamos informarles que*\n┊   *@${phone} está...*\n┊   *...caido en combate.*\n┊➤ *Ahora somos ${memberCount} miembros.*\n┊ ︿︿︿︿︿︿︿︿︿︿︿\n╰─────────────────╯`
                    await client.sendMessage(anu.id, { image: { url: pp }, caption, mentions: [jid], ...fakeContext })
                }
*/

                    if (anu.action === 'promote' && chat?.alerts && (!primaryBotId || primaryBotId === botId)) {
                        const usuario = anu.author || 'Sistema'
                        await client.sendMessage(anu.id, {
                            text: `「✎」 *@${phone}* ha sido promovido a Administrador por *@${usuario.split('@')[0]}.*`,
                            mentions: [jid, usuario]
                        })
                    }

                    if (anu.action === 'demote' && chat?.alerts && (!primaryBotId || primaryBotId === botId)) {
                        const usuario = anu.author || 'Sistema'
                        await client.sendMessage(anu.id, {
                            text: `「✎」 *@${phone}* ha sido degradado de Administrador por *@${usuario.split('@')[0]}.*`,
                            mentions: [jid, usuario]
                        })
                    }
                }
            } catch (err) {
                console.error(chalk.red(`[ EVENTS ERROR ] →`), err)
            }
        })
        client._groupParticipantsRegistered = true
    }
}