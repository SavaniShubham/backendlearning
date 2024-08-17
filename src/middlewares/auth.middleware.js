import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


 export const verifyJWT = asyncHandler(async (req , _, next)=>
{ //we add customobject in request using middleware 
    
    try {

        console.log("this line !!!");
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
         //we cna get the token from  direct the cookie or in header => Authorization :Bearer <token> we send the token and we get the token from it (here we replace "bearer " with "" so only token will be there )  
         
        console.log("this line !!!");
         if (!token) {
            throw new ApiError(401 , "Unauthorized request")
         }
         
        console.log("this line !!!");
    
        const decodedtoken  = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
        console.log(decodedtoken);
        
        console.log("this line !!!");
    
       const user  = await User.findById(decodedtoken?._id).select("-refreshToken -password");
       if (!user) {
        //
        throw new ApiError(401 , "Invalid access Token")
       }
    
       req.user =user ; //here add new object in req  
       next();
    } 
    catch (error)
    {
        throw new ApiError(401 , error?.message || "Invalid Access Token");
    }

}) 