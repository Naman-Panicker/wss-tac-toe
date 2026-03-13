import { WebSocketServer } from 'ws';
import express from "express";
import type WebSocket from 'ws';
import generateID from './genId.js';

const app = express();

const httpServer = app.listen(3000)

interface Room{
    sockets: WebSocket[]
}

const rooms: Record<string, Room> = {}

const wss = new WebSocketServer({server: httpServer});


wss.on('connection', function connection(ws){

    console.log("Someone connected")

    ws.on('error', console.error)

    ws.on('message', async function message(data: Buffer){

        console.log("Data received: ", data);

        const parsedData = JSON.parse(data.toString());
        console.log("Parsed Data: \n", parsedData)

        if(parsedData.type == "join-room"){
            const room = parsedData.room;

            if(!rooms[room]){

                ws.send("The given roomID does not exist.", (err)=>{
                    console.log(err);
                })

            }else{

                rooms[room].sockets.push(ws);

                console.log(parsedData.username, " just joined in: ", room);

                rooms[room].sockets.forEach((socket)=>{
                    socket.send(parsedData.username + " just joined.")
                })

            }

        }else if(parsedData.type == "create-room"){
            const room = await generateID();

            rooms[room]={
                sockets:[]
            }

            rooms[room].sockets.push(ws);
            console.log(parsedData.username, " created a new room with ID: ", room)

            ws.send("New room created with ID: " + room)
        }
    })

    ws.on('close', function close(data: Buffer){

        for (const room of Object.values(rooms)) {

            room.sockets = room.sockets.filter(socket => socket !== ws);
        }

        console.log("Connection Closed")
    })
})
