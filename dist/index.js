import express, {} from "express";
import { WebSocketServer } from "ws";
const app = express();
const httpServer = app.listen(8080);
let userCount = 0;
const wss = new WebSocketServer({ server: httpServer });
wss.on("connection", function connection(ws) {
    ws.on('error', console.error);
    ws.on('message', function message(data, isBinary) {
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data, { binary: isBinary });
            }
        });
    });
    console.log("User connected: ", ++userCount);
    ws.send('Hello! Message From Server!!');
});
// app.post("/api/v1/signup", (req: Request, res: Response)=>{
//     const [email, password, username] = req.body
//     if(!email || !password){
//         return res.status(400).json("Invalid email and password format")
//     }
//     const 
// })
// app.post("/api/v1/signin", (req: Request, res: Response)=>{
//     const [email, password] = req.body
//     if(!email || !password){
//         return res.json("Enter credentials")
//     }else if()
// })
// app.get("/api/v1/rooms", (req: Request, res: Response)=>{
//     return res.json("rooms")
// })
// app.post("/api/v1/join-room", (req: Request, res: Response)=>{
// })
// app.post("/api/v1/create-room", (req: Request, res: Response)=>{
// })
// app.get("/api/v1/get-game-history", (req: Request, res: Response)=>{
// })
// app.get("/api/v1/game/:gameId", (req: Request, res: Response)=>{
// })
// app.get("/api/v1/user/stats", (req: Request, res: Response)=>{
// })
//# sourceMappingURL=index.js.map