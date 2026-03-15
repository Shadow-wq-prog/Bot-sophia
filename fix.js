/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗

https://chat.whatsapp.com/IyxuHbUdgvYBcVit6sThOO
*/

// este es un parche de compatibilidad para el handler actual, Alya en su última update (02/2026) cambió la forma de leer y procesar los comandos, y para no reescribir todo preferí hacer un parche de compatibilidad


import fetch, { FormData, Headers, Request, Response } from 'node-fetch';

global.fetch = fetch;
global.FormData = FormData;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;

console.log('Bienvenido...');