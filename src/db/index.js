import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>
{
    try {
       const connectionInstence = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       console.log(connectionInstence);
       console.log(`Mongodb connected !! db host :${connectionInstence.connection.host}`)
        
    } catch (error) {

        console.log("Mongodb connection Failed : ",error);
        process.exit(1);
        
    }
}

export default connectDB;