const connectedClients = {}; // { userId: [socketId1, socketId2, ...] }

export const socketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log(`Nuevo cliente conectado: ${socket.id}`);

        socket.on("registerSession", (userId) => {
            if (!userId) {
                console.log("ERROR: No se recibió userId en registerSession");
                return;
            }

            console.log(`Usuario ${userId} registrado con socket ${socket.id}`);

            if (!connectedClients[userId]) {
                connectedClients[userId] = [];
            }
            connectedClients[userId].push(socket.id);

            console.log(`Conexiones activas de ${userId}:`, connectedClients[userId]);

            // Si hay más de una conexión para el mismo usuario, preguntar cuál mantener
            if (connectedClients[userId].length > 1) {
                console.log(`Usuario ${userId} tiene múltiples conexiones. Enviando advertencia...`);
                io.to(connectedClients[userId][0]).emit("sessionOverrideRequest", {
                    message: "Se detectó un inicio de sesión en otra pestaña. ¿Deseas mantener la sesión aquí?",
                });
            }
        });

        socket.on("sessionOverrideResponse", ({ userId, keepSession }) => {
            console.log(`Respuesta de sesión recibida de ${userId}: keepSession=${keepSession}`);

            if (keepSession) {
                console.log(`Manteniendo sesión en la nueva pestaña para ${userId}`);
                const socketsToDisconnect = connectedClients[userId].slice(0, -1);
                socketsToDisconnect.forEach((socketId) => {
                    io.to(socketId).emit("sessionExpired", { message: "Tu sesión ha sido cerrada en esta pestaña." });
                    io.sockets.sockets.get(socketId)?.disconnect(true);
                });

                // Mantiene solo la última conexión activa
                connectedClients[userId] = [connectedClients[userId].slice(-1)[0]];
            } else {
                console.log(`Cerrando la nueva sesión para ${userId}`);
                const latestSocketId = connectedClients[userId].pop();
                io.to(latestSocketId).emit("sessionExpired", { message: "Has decidido mantener la sesión en la otra pestaña." });
                io.sockets.sockets.get(latestSocketId)?.disconnect(true);
            }
        });

        socket.on("disconnect", () => {
            console.log(`Cliente desconectado: ${socket.id}`);
            Object.keys(connectedClients).forEach((userId) => {
                connectedClients[userId] = connectedClients[userId].filter((id) => id !== socket.id);
                if (connectedClients[userId].length === 0) {
                    delete connectedClients[userId];
                }
            });
        });
    });
};

export const notifySessionChange = (io, userId, eventType) => {
    if (connectedClients[userId]) {
        console.log(`Notificando sesión a userId=${userId}, evento=${eventType}`);

        // Enviar el evento de notificacion
        io.to(connectedClients[userId]).emit("sessionOverrideRequest", {
            message: "Se detectó un inicio de sesión desde otra ventana. ¿Deseas mantener tu sesión aquí?",
        });

        // Registrar si se recibe la respuesta del cliente
        io.once("sessionOverrideResponse", ({ keepSession }) => {
            console.log(`Respuesta recibida de userId=${userId}, keepSession=${keepSession}`);

            if (!keepSession) {
                console.log(`Enviando evento de cierre de sesión a userId=${userId}`);
                io.to(connectedClients[userId]).emit("sessionExpired", {
                    message: "Tu sesión ha sido cerrada en otro dispositivo.",
                });
            }
        });
    } else {
        console.log(`No se encontró conexión activa para userId=${userId}`);
    }
};
