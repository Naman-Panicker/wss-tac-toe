import { WebSocketServer } from 'ws';
import express from "express";
import type WebSocket from 'ws';
import generateID from './genId.js';

const app = express();

const httpServer = app.listen(3000)

interface Symbols{
    symbol: "X"|"O"
}

enum GameStatus{
    ONGOING,
    X_WINNER,
    O_WINNER,
    DRAW
}

interface Coordinates{
    x: string,
    y: string
}

interface Room{
    players: {socket: WebSocket, symbol: "X" | "O"}[],
    spectators: WebSocket[],
    board: Record<string, Symbols|null>,
    gameStatus: GameStatus
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

                if(rooms[room].players.length + rooms[room].spectators.length < 5)
                    {
                        if(rooms[room].players.length < 2)
                            {
                                rooms[room].players.push({
                                    socket:ws,
                                    symbol: parsedData.symbol
                                });

                                console.log(parsedData.username, " just joined in: ", room);

                                rooms[room].players.forEach((player)=>{
                                    player.socket.send(parsedData.username + " just joined.")
                                })
                            }
                        else{
                                rooms[room].spectators.push(ws);

                                ws.send("Room full. Joined as spectator");

                                rooms[room].players.forEach((player)=>{
                                    player.socket.send(parsedData.username + " just joined.")
                                });
                                
                                rooms[room].spectators.forEach((spectator)=>{
                                    spectator.send(parsedData.username + " just joined.")
                                })
                            }
                    }
                else{
                    ws.send("Room is full");
                }

            }

        }else if(parsedData.type == "create-room"){
            const room = await generateID();

            rooms[room]={
                players:[],
                spectators: [],
                board: {},
                gameStatus: GameStatus.ONGOING
            }

            

            rooms[room].players.push({
                socket: ws,
                symbol: parsedData.symbol
            })
            console.log(parsedData.username, " created a new room with ID: ", room)

            ws.send("New room created with ID: " + room)
        }



        // GAMEPLAY LOGIC
        let moves = 0;

        

    })

    ws.on('close', function close(data: Buffer){

        for (const room of Object.values(rooms)) {

            room.players = room.players.filter(socket => socket.socket !== ws);
            room.spectators = room.spectators.filter(socket=>socket!==ws);
        }

        console.log("Connection Closed")
    })
})
