import app from "./app.js";
import connectDB from "./db/index.js";
// require('dotenv').config({path:'.env'})
import  dotenv from "dotenv";
dotenv.config({
    path:'./env'
})



connectDB()
.then( ()=>
{
    app.on("error",(error)=>
    {
        console.log("server running error :" , error);

    })
    app.listen(process.env.PORT || 3000,(()=>
    {
        console.log(`SERVER IS RUNNING AT PORT ${process.env.PORT}`);
    }))
})
.catch((err)=> console.log("Mongodb connection failed !!!"))













// import express from "express";

// const app=express();

// (async ()=>
// {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error",(error)=>
//         {
//             console.log("error",error);
//             throw error
//         })

//         app.listen(process.env.PORT,()=>
//         {
//             console.log(`app is listening on port ${process.env.PORT}`);
//         })


        
//     } catch (error) {
//         console.error("Error :",error);
//         throw error
//     }

// })()