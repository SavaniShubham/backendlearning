import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app=express();


app.use(cors(
    {
        origin:process.env.CROSS_ORIGIN,
        credentials:true,
    }
))

app.use(express.json({limit:"20kb"}))

app.use(express.urlencoded({extended:true , limit:"20kb"}))

app.use(express.static("public"))

app.use(cookieParser())

import userouter from "./routes/user.routes.js"

app.use("/api/v1/users",userouter);

//http://localhost:4000/api/v1/users/register

export default app;