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


    const extractPublicIdFromUrl = (url) => {
        if (typeof url !== 'string') {
            throw new TypeError('Expected a string URL');
        }
    
        // Extract the path from the URL
        const urlParts = url.split('/');
        console.log(urlParts);
    
        // Get the part after the 7th slash and join remaining parts
        const publicIdWithExtension = urlParts.slice(7).join('/');
        console.log(publicIdWithExtension);
    
        // Remove the file extension
        const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "");
        console.log(publicId);
    
        return publicId;
    };
    
    export const deleteFromCloudinaryByUrl = async (url) => {
        try {
            if (!url) {
                throw new Error('URL is required');
            }
    
            const publicId = extractPublicIdFromUrl(url);
    
            const response = await cloudinary.uploader.destroy(publicId, {
                resource_type: "auto", // or "video", "raw", "auto" depending on the type of resource
            });
            console.log(response);
    
            if (response.result === "ok") {
                console.log("FILE is deleted from Cloudinary", publicId);
                return response;
            } else {
                console.log("Failed to delete the file from Cloudinary", response);
                return null;
            }
        } catch (error) {
            console.log("Error deleting file from Cloudinary", error);
            return null;
        }
    };
    




    export default uploadoncloudinary;



