import {
  proto,
  delay,
  areJidsSameUser,
  generateWAMessage,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  downloadContentFromMessage,
  generateMessageID,
  generateWAMessageContent,
  getContentType,
  getDevice,
  extractMessageContent,
} from '@whiskeysockets/baileys';
import { resolveLidToRealJid } from "./utils.js"
import chalk from 'chalk';
import fs from 'fs';
import axios from 'axios';
import moment from 'moment-timezone';
import { sizeFormatter } from 'human-readable';
import util from 'util';
import * as Jimp from 'jimp';
import fetch from 'node-fetch';
import FileType from 'file-type';
import path from 'path';
import exif from './exif.js';
import { fileURLToPath } from 'url'
import GraphemeSplitter from 'grapheme-splitter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = exif;

const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000)
export {unixTimestampSeconds};

export function generateMessageTag(epoch) {
  let tag = (0, exports.unixTimestampSeconds)().toString()
  if (epoch) tag += '.--' + epoch
  return tag
}

export function processTime(timestamp, now) {
  return moment.duration(now - moment(timestamp * 1000)).asSeconds()
}

export function getRandom(ext) {
  return `${Math.floor(Math.random() * 10000)}${ext}`
}

export async function getBuffer(url, options) {
  try {
    options ? options : {}
    const res = await axios({
      method: 'get',
      url,
      headers: { DNT: 1, 'Upgrade-Insecure-Request': 1 },
      ...options,
      responseType: 'arraybuffer',
    })
    return res.data
  } catch (err) { return err }
}

export async function fetchJson(url, options) {
  try {
    options ? options : {}
    const res = await axios({
      method: 'GET',
      url: url,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36' },
      ...options,
    })
    return res.data
  } catch (err) { return err }
}

export function runtime(seconds) {
  seconds = Number(seconds)
  var d = Math.floor(seconds / (3600 * 24))
  var h = Math.floor((seconds % (3600 * 24)) / 3600)
  var m = Math.floor((seconds % 3600) / 60)
  var s = Math.floor(seconds % 60)
  var dDisplay = d > 0 ? d + (d == 1 ? ' day, ' : ' days, ') : ''
  var hDisplay = h > 0 ? h + (h == 1 ? ' hour, ' : ' hours, ') : ''
  var mDisplay = m > 0 ? m + (m == 1 ? ' minute, ' : ' minutes, ') : ''
  var sDisplay = s > 0 ? s + (s == 1 ? ' second' : ' seconds') : ''
  return dDisplay + hDisplay + mDisplay + sDisplay
}

export function clockString(ms) {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [h, m, s].map((v) => v.toString().padStart(2, 0)).join(':')
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isUrl(url) {
  return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))
}

export function getTime(format, date) {
  if (date) { return moment(date).locale('id').format(format) }
  else { return moment.tz('America/Bogota').locale('id').format(format) }
}

export function sanitizeFileName(str) {
  return str.replace(/[<>:"/\\|?*]/g, '').substring(0, 64).trim()
}

export function formatDate(n, locale = 'id') {
  let d = new Date(n)
  return d.toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  })
}

export function tanggal(numer) {
  let myMonths = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','diciembre']
  let myDays = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  var tgl = new Date(numer)
  var day = tgl.getDate()
  let bulan = tgl.getMonth()
  var thisDay = tgl.getDay(), thisDay = myDays[thisDay]
  var yy = tgl.getYear()
  var year = yy < 1000 ? yy + 1900 : yy
  return `${thisDay}, ${day} - ${myMonths[bulan]} - ${year}`
}

export var formatp = sizeFormatter({
  std: 'JEDEC', decimalPlaces: 2, keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
});

export function jsonformat(string) { return JSON.stringify(string, null, 2) }

function format(...args) { return util.format(...args) }

export function logic(check, inp, out) {
  if (inp.length !== out.length) throw new Error('La entrada y la salida deben tener la misma longitud')
  for (let i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i]
  return null
}

export async function generateProfilePicture(buffer) {
  const jimp = await Jimp.read(buffer)
  const min = jimp.getWidth()
  const max = jimp.getHeight()
  const cropped = jimp.crop(0, 0, min, max)
  return {
    img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
    preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
  }
}

export function bytesToSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes','KB','MB','GB','TB','PB','EB','ZB','YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function getSizeMedia(path) {
  return new Promise((resolve, reject) => {
    if (/http/.test(path)) {
      axios.get(path).then((res) => {
        let length = parseInt(res.headers['content-length'])
        let size = bytesToSize(length, 3)
        if (!isNaN(length)) resolve(size)
      })
    } else if (Buffer.isBuffer(path)) {
      let length = Buffer.byteLength(path)
      let size = bytesToSize(length, 3)
      if (!isNaN(length)) resolve(size)
    } else { reject('error') }
  })
}

export function pickRandom(list) { return list[Math.floor(list.length * Math.random())] }

export function parseMention(text = '') {
  return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((v) => v[1] + '@s.whatsapp.net')
}

export function getGroupAdmins(participants) {
  let admins = []
  for (let i of participants) {
    i.admin === 'superadmin' ? admins.push(i.id) : i.admin === 'admin' ? admins.push(i.id) : ''
  }
  return admins || []
}

export async function fixLid(client, m) {
  const decodedJid = client.decodeJid((m.fromMe && client.user.id) || m.key.participant || m.chat || '')
  const realJid = await resolveLidToRealJid(decodedJid, client, m.chat)
  return realJid
}

export async function fixLid2(client, m) {
  const decodedJid = client.decodeJid(m.msg.contextInfo.participant)
  const realJid = await resolveLidToRealJid(decodedJid, client, m.chat)
  return realJid
}

export async function smsg(client, m, store) {
  client.downloadMediaMessage = async (message) => {
    const msg = message.msg || message
    const mime = msg.mimetype || ''
    const messageType = (message.type || mime.split('/')[0]).replace(/Message/gi, '')
    const stream = await downloadContentFromMessage(msg, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]) }
    return buffer
  }

  if (!m) return m
  if (m.key) {
    m.id = m.key.id
    m.chat = m.key.remoteJid
    m.fromMe = m.key.fromMe
    m.isBot = ['HSK','BAE','B1E','3EB0','B24E','WA'].some((a) => m.id.startsWith(a))
    m.isGroup = m.chat.endsWith('@g.us')
    m.sender = await fixLid(client, m)
  }

  if (m.message) {
    m.type = getContentType(m.message) || Object.keys(m.message)[0]
    m.msg = /viewOnceMessage|viewOnceMessageV2Extension|editedMessage|ephemeralMessage/i.test(m.type)
      ? m.message[m.type].message[getContentType(m.message[m.type].message)]
      : extractMessageContent(m.message[m.type]) || m.message[m.type]
    m.body = m.message?.conversation || m.msg?.text || m.msg?.conversation || m.msg?.caption || ''
    
    // ── LÓGICA DE PREFIJO √ ──
    const splitter = new GraphemeSplitter()
    let activePrefixes = [global.prefix || '√', '.', '/', '!', '#']
    m.usedPrefix = ''
    for (const p of activePrefixes) {
      if (m.body?.startsWith(p)) { m.usedPrefix = p; break }
    }
    m.command = m.body && m.body.replace(m.usedPrefix, '').trim().split(/ +/).shift()
    m.args = m.body?.trim().replace(new RegExp('^' + (m.usedPrefix || '').replace(/[.*=+:\-?^${}()|[\]\\]|\s/g, '\\$&'), 'i'), '').replace(m.command, '').split(/ +/).filter((a) => a) || []

    m.quoted = m.msg?.contextInfo?.quotedMessage || null
    if (m.quoted) {
      m.quoted.message = extractMessageContent(m.msg?.contextInfo?.quotedMessage)
      m.quoted.type = getContentType(m.quoted.message) || Object.keys(m.quoted.message)[0]
      m.quoted.id = m.msg.contextInfo.stanzaId
      m.quoted.sender = await fixLid2(client, m)
      m.quoted.text = m.quoted.caption || m.quoted.conversation || ''
      m.quoted.body = m.quoted.msg?.text || m.quoted.msg?.caption || ''
    }
  }

  m.reply = async (content, options = {}) => {
    return client.sendMessage(m.chat, { text: content, ...options }, { quoted: m })
  }

  m.react = (text) => client.sendMessage(m.chat, { react: { text, key: m.key } })

  return m
}

export async function sendImageAsSticker(client, jid, path, quoted, options = {}) {
    let buff = Buffer.isBuffer(path) ? path
      : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64')
      : /^https?:\/\//.test(path) ? await getBuffer(path)
      : fs.existsSync(path) ? fs.readFileSync(path)
      : Buffer.alloc(0)
    let buffer
    if (options && (options.packname || options.author)) { buffer = await writeExifImg(buff, options) }
    else { buffer = await imageToWebp(buff) }
    await client.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
    return buffer
}
