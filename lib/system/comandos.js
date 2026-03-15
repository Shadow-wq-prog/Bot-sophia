export const commands = [
    // ... (Todos los comandos anteriores se mantienen igual) ...
    
    // DOWNLOADS (Asegúrate de que estos alias coincidan con tus archivos en commands/)
    { name: "ytmp3", desc: "Descarga audio de youtube.", alias: ["play", "mp3", "playaudio", "ytaudio", "ytmp3"], category: "downloads", uso: "_<url|query>_" },
    { name: "ytmp4", desc: "Descarga video de youtube.", alias: ["play2", "mp4", "playvideo", "ytvideo", "ytmp4"], category: "downloads", uso: "_<url|query>_" },

    // ... (Mantén todas las categorías: PREMIUM, CASINO, ECONOMIA, JUEGOS, TRABAJOS, GACHA, REGALOS, BROMAS, IA, ANIME, PROFILE) ...

    // INFO (Sección final que estaba incompleta)
    { name: "infobot", desc: "Muestra información técnica del bot", alias: ["infobot", "botinfo"], category: "info" },
    { name: "ping", desc: "Ver la velocidad de respuesta", alias: ["ping", "ms"], category: "info" },
    { name: "owner", desc: "Muestra el contacto del dueño", alias: ["owner", "creador"], category: "info" },
    { name: "menu", desc: "Muestra la lista de comandos", alias: ["menu", "help", "h"], category: "info" }
];

// Función para obtener el comando por nombre o alias
export const getCommand = (cmdName) => {
    return commands.find(c => c.name === cmdName || (c.alias && c.alias.includes(cmdName)));
};
