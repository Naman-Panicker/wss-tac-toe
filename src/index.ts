import { WebSocketServer } from 'ws';
import express from "express";
import type WebSocket from 'ws';
import generateID from './genId.js';

const app = express();

const httpServer = app.listen(3000)


enum GameStatus{
    ONGOING,
    X_WINNER,
    O_WINNER,
    DRAW
}

enum Symbols{
    X = "X",
    O = "O",
    EMPTY = ""
}


interface Room{
    players: {socket: WebSocket, symbol: Symbols}[],
    spectators: WebSocket[],
    board: Symbols[][],
    gameStatus: GameStatus,
    turn: Symbols
}


const rooms: Record<string, Room> = {}

const wss = new WebSocketServer({server: httpServer});


wss.on('connection', function connection(ws){

    console.log("Someone connected")

    ws.on('error', console.error)

    ws.on('message', async function message(data: Buffer){

        // console.log("Data received: ", data);

        const parsedData = JSON.parse(data.toString());
        console.log("Parsed Data: ", parsedData, "\n\n")





        // ROOM JOINING LOGIC. CAN JOIN AS PLAYER OR AS SPECTATOR

        if(parsedData.type == "join-room"){

            const room = parsedData.room;
            const username = parsedData.username

            if(!rooms[room]){

                ws.send("The given roomID does not exist.", (err)=>{
                    console.log(err);
                })

                return

            }else{

                if(rooms[room].players.length + rooms[room].spectators.length < 5)
                    {
                        if(rooms[room].players.length < 2)
                            {

                                let symbol = null;

                                rooms[room].players.length === 0 ? symbol = Symbols.O : symbol = Symbols.X

                                rooms[room].players.push({
                                    socket:ws,
                                    symbol: symbol
                                });

                                 rooms[room].turn === Symbols.EMPTY ? rooms[room].turn = Symbols.O : rooms[room].turn = Symbols.X    // ASSIGN FIRST TURN

                                console.log("\n\n", parsedData.username, " just joined in roomID: ", room);

                                rooms[room].players.forEach((player)=>{
                                    player.socket.send(username + " just joined.")
                                })

                                
                                console.log("\n\nCurrent Room State: ",rooms[room])
                            }
                        else{
                                rooms[room].spectators.push(ws);

                                ws.send("Room full. Joined as spectator");

                                rooms[room].players.forEach((player)=>{
                                    player.socket.send(username + " just joined.")
                                });
                                
                                rooms[room].spectators.forEach((spectator)=>{
                                    spectator.send(username + " just joined.")
                                })

                                console.log("\n\nCurrent Room State: ",rooms[room])
                            }
                    }
                else{
                    ws.send("Room is full");
                };
            }


        // ROOM CREATION LOGIC. ONLY JOINS AS PLAYER.

        }else if(parsedData.type == "create-room"){

            const room = await generateID();
            

            rooms[room]={
                players:[],
                spectators: [],
                board: [ [Symbols.EMPTY, Symbols.EMPTY,Symbols.EMPTY], [Symbols.EMPTY, Symbols.EMPTY,Symbols.EMPTY], [Symbols.EMPTY,Symbols.EMPTY,Symbols.EMPTY] ] ,
                gameStatus: GameStatus.ONGOING,
                turn: Symbols.EMPTY
            }

            

            rooms[room].players.push({
                socket: ws,
                symbol: Symbols.O 
            })
            console.log(parsedData.username, " created a new room with ID: ", room)

            ws.send("New room created with ID: " + room)
            console.log("\n\nCurrent Room State: ",rooms[room])
        }



        // GAMEPLAY. MESSAGE BROADCASTED TO ALL SOCKETS IN THE ROOM.
        
        else if(parsedData.type === "play"){

            const room = parsedData.room;
            

            // ROOM VALIDATION
            if(!rooms[room]){
                ErrorMessage(ws, "Room Does Not Exist")
                return;
            };


            // PLAYER VALIDATION
            const player = rooms[room].players.find(player=>player.socket === ws);

            if(!player){
                ErrorMessage(ws, "You are not a player");
                return;
            }


            // TURN VALIDATION
            const playerSymbol = player.symbol

            if(playerSymbol !== rooms[room].turn){
                ErrorMessage(ws, "Not your turn");
                return;
            }

            //MOVE VALIDATION
            const x = parsedData.move.x;
            const y = parsedData.move.y;

            

            if(x<0 || x>2 || y<0 || y>2){
                ErrorMessage(ws, "Invalid Move request");
                return;
            }

            if(rooms[room].board[x]?.[y] !== Symbols.EMPTY){                                        //OPTIONAL CHAINING ON THIS LINE BECAUSE TS ISN'T HAPPY WITH MY EARLY CHECK ON ROOM'S EXISTENCE
                ErrorMessage(ws, "Invalid Move Request, Coordinate is not empty.");
                return;
            }

            
            //MOVE APPLICATION
            
            rooms[room].board[x][y] = playerSymbol;


            // TURN SWITCH        
            rooms[room].turn = playerSymbol === Symbols.O? Symbols.X : Symbols.O;


            // BROADCAST
            BroadcastBoard(room);

            
            // WIN CHECK
            WinCheck(room);
        }

                


    })

    ws.on('close', function close(data: Buffer){

        for (const room of Object.values(rooms)) {

            room.players = room.players.filter(socket => socket.socket !== ws);
            room.spectators = room.spectators.filter(socket=>socket!==ws);
            console.log("\n\nRemaining players in room are: ",room.players)
            console.log("\n\n& Remaining spectators in room are: ",room.spectators)
        }

        console.log("Connection Closed")
    })
})



// REUSABLE BOARD BROADCAST FUNCTION

function BroadcastBoard(room: string){

    if(!rooms[room]){
        console.log("Internal server error, room not found.");
        return
    }

    const message = JSON.stringify({type:"board-update", board: rooms[room].board, turn: rooms[room].turn});

    rooms[room].players.forEach((player)=>{player.socket.send(message)});
    rooms[room].spectators.forEach((spectator)=>{spectator.send(message)})
}


function ErrorMessage(ws: WebSocket, msg: string){

    const message = JSON.stringify({type: "Error", message: msg});

    ws.send(message);
}


function WinCheck(room: string){

    let roomObj = rooms[room];

    if(!roomObj){
        return;
    }

    let b = roomObj.board;



    // ROW CONDITION
    for(let i=0; i<3; i++){
        
        
        if(b[i][0] === b[i][1] && b[i][1] === b[i][2] && b[i][0] !== Symbols.EMPTY){
            
            
            if(b[i][0] === Symbols.O){
                return GameStatus.O_WINNER;
            }else if( b[i][0] === Symbols.X ){
                return GameStatus.X_WINNER;
            }else{
                DrawCheck(room);
            }

        }
        
    }

    // COLUMN CONDITION
    for(let i=0; i<3; i++){
        
        //@ts-ignore
        if(b[0][i] === b[1][i] && b[1][i] === b[2][i] && b[0][i] !== Symbols.EMPTY){
            
            if(b[0][i] === Symbols.O){
                return GameStatus.O_WINNER;
            }else if( b[0][i] === Symbols.X ){
                return GameStatus.X_WINNER;
            }else{
                DrawCheck(room);
            }
            
        }
        
    }


    // DIAGONAL CONDITION

    // @ts-ignore
    if(b[1][1] === b[2][2] && b[0][0] === b[1][1] && b[0][0] !== Symbols.EMPTY){

        if(b[0][0] === Symbols.O){
                return GameStatus.O_WINNER;
            }else if( b[0][0] === Symbols.X ){
                return GameStatus.X_WINNER;
            }else{
                DrawCheck(room);
            }
    }
    //@ts-ignore
    else if(b[0][2] === b[1][1] && b[0][2] === b[2][0] && b[0][2] !== Symbols.EMPTY){

        if(b[0][2] === Symbols.O){
                return GameStatus.O_WINNER;
            }else if( b[0][2] === Symbols.X ){
                return GameStatus.X_WINNER;
            }else{
                return DrawCheck(room);
            }
    }


    return DrawCheck(room);    


}


function DrawCheck(room: string): GameStatus {

    const roomObj = rooms[room];


    if (!roomObj) return GameStatus.ONGOING;

    const b = roomObj.board;

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (b[i][j] === Symbols.EMPTY) {
                return GameStatus.ONGOING;
            }
        }
    }

    return GameStatus.DRAW;
}