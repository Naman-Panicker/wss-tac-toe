import express, { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import prisma from "./config/prisma.js";
import { UserSchema } from "./validators/authValidators.js";
import jwt from "jsonwebtoken"

const app = express();
const secret = process.env.JWT_SECRET;

if(!secret){
    throw new Error("No key set for JWT")
}

app.use(express.json());


app.post("/api/v1/signin", async (req: Request, res: Response)=>{

    const {username ,password} = req.body;

    if(!UserSchema.safeParse({username: username, password: password}).success){

        res.json("Enter valid credentials");
        return;

    }

    try{

        const user = await prisma.users.findUnique({
            where:{
                username:username,
            }
        })

        if(!user){
            res.json("Invalid Credentials")
            return;
        }

        const passwordCheck = bcrypt.compareSync(password, user.password)

        if(!passwordCheck){
            res.json("Invalid Credentials");
            return;
        }

        const token = jwt.sign({
            id: user.id,
            username: user.username
        }, secret, { expiresIn:"1h" })

        res.json({
            "message": "Successfully Logged In",
            "token": token
        })


    }catch(err){
        res.json({"message": "Something went wrong!"})
    }

    
})

app.post("/api/v1/signup", async (req: Request, res: Response)=>{

    const {username ,password, email} = req.body;

    if(!UserSchema.safeParse({ username: username, password: password, email: email }).success)
        { 
            res.json("Enter valid credentials"); 
            return;
        }

    const hash = bcrypt.hashSync(password, 12);

    try{

        const user = await prisma.users.create({
            data:{
                username: username,
                password: hash,
                email: email
            }
        })

        console.log("User created with credentials: ", user.id, " & ", user.username);

        res.status(201).json("Completed Signup");


    }catch(error){
        res.status(500).json({"message": "Something went wrong"});
    }
    
})

app.listen(3001);