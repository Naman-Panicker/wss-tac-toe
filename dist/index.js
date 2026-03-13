import { WebSocketServer } from 'ws';
import express from "express";
import generateID from './genId.js';
const app = express();
const httpServer = app.listen(3000);
const rooms = {};
const wss = new WebSocketServer({ server: httpServer });
wss.on('connection', function connection(ws) {
    console.log("Someone connected");
    ws.on('error', console.error);
    ws.on('message', async function message(data) {
        console.log("Data received: ", data);
        const parsedData = JSON.parse(data);
        console.log("Parsed Data: \n", parsedData);
        if (parsedData.type == "join-room") {
            const room = parsedData.room;
            if (!rooms[room]) {
                rooms[room] = {
                    sockets: []
                };
            }
            rooms[room].sockets.push(ws);
            console.log(parsedData.username, " just joined in: ", room);
            rooms[room].sockets.forEach((socket) => {
                socket.send(parsedData.username + " just joined.");
            });
        }
        else if (parsedData.type == "create-room") {
            const room = await generateID();
            rooms[room] = {
                sockets: []
            };
            rooms[room].sockets.push(ws);
            ws.send("New room created with ID: " + room);
        }
    });
    ws.on('close', function close() {
        console.log("Connection Closed");
    });
});
//# sourceMappingURL=index.js.map