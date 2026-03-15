/*
Creador: 亗𝙽𝚎𝚝𝚑𝚎𝚛𝙻𝚘𝚛𝚍亗

https://chat.whatsapp.com/IyxuHbUdgvYBcVit6sThOO
*/

//este es el cargador del parche de compatibilidad 


import fetchPkg from 'node-fetch';

const fetch = fetchPkg.default || fetchPkg;
const FormData = fetchPkg.FormData || global.FormData;
const Headers = fetchPkg.Headers || global.Headers;
const Request = fetchPkg.Request || global.Request;
const Response = fetchPkg.Response || global.Response;

global.fetch = fetch;
global.FormData = FormData;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;

global.fetch.default = fetch;

console.log('Bienvenido...');