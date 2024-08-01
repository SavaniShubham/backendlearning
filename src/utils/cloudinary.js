import { v2 as cloudinary } from "cloudinary";
import fs from "fs";



    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key:process.env.API_KEY,
        api_secret:process.env.API_SECRET,
    });

    const uploadoncloudinary =async (localfilepath)=>
    {
        try {
            if (!localfilepath) return null;
                
            const response =  await cloudinary.uploader.upload(localfilepath,
                {
                    resource_type:"auto"
                }
            )
            console.log(response);
            console.log("FILE is uploaded on cloudinary ",response.url);
            fs.unlinkSync(localfilepath);
            return response;
            
        } catch (error) {

            console.log("FILE is uploaded on cloudinary failed ");
            fs.unlinkSync(localfilepath);//remove the locally save file as the upload operation failed
            return null;  
        }

    }

    export default uploadoncloudinary;



