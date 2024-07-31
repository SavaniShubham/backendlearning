import { User } from "../modules/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadoncloudinary from "../utils/cloudinary.js";

const registeruser = asyncHandler( async (req, res)=> {


 // step -1 :get the user details (get images using middleware in user.routes.js )
     // console.log( "request :" ,req);
   console.log( "request body  :" ,req.body);
    const {fullname , username , email , password}=req.body;
    console.log("full name :" , fullname);
   //  console.log("username :" , username);
   //  console.log("email:" , email);
    

 // step -2 :check validation - no empty (also can write validation for email , password etc that cotain proprer charchter on not like that)
   // if(fullname === "")
   // {
   //    throw new ApiError(400,"FullName is required")
   // }you can do like that for username , email  , password also but we some method 
   if ([fullname , username , email ,password ].some((filed)=>filed?.trim()==="")) {
      throw new ApiError(400,"ALL fileds are required")
   }

//  step -3 :check if user already exist or not

       const existeduser = await User.findOne({
         $or: [{ username }, { email }]
          });

      if(existeduser)
      {
         throw new ApiError(409,"user with email or username exist")
      }

// step -4 : check for images,check for avatar
   //you use multer middleware to get image this multer add more fileds to request 
   //here files filed added by multer in request
   //images has so many option for check lige jpg , png , size etc 

   console.log(req.files);
   console.log(req.files?.avatar);
   const avatarLocalPath = req.files?.avatar[0]?.path;
   // const coverImagepath = req.files?.coverImage[0]?.path;

    //if coverimage is not send
   let coverImagepath ;
     
     if (req.files && Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0) {
      coverImagepath = req.files.coverImage[0].path;
     }
   if (!avatarLocalPath) {

      throw new ApiError(400 , "Avatar file is required");
      
   }
// step -5 :upload them to cloudinary

     const avatar =await uploadoncloudinary(avatarLocalPath);
     const coverImage=await uploadoncloudinary(coverImagepath);
     console.log(avatar);

     if (!avatar)
     {
      throw new ApiError(400 , "Avatar file is required");
      
     }
// step-6: create user object - create entry in db

   const user = await User.create(
      {
         fullname,
         avatar:avatar.url,
         coverImage:coverImage?.url ||"",
         email,
         password,
         username:username.toLowerCase()
      }
    )
    console.log(user);

 // step -7 :remove password and refresh token field from response

      const createduser = await User.findById(user._id).select("-password -refreshToken");//this two field withoutfileds are selected
      //there otherways to do it
      console.log(createduser);
      
// step-8 :check for user creation
     if (!createduser)
     {

         throw new ApiError(500 , "something went wrong while registering the user")      
     }

// step -9 :return response
   return res.status(201).json(
      new ApiResponse(201 , createduser ,"User registerd Successfully")
   )


    // res.status(200).json(
    //     {
    //         message:"ok",
    //     }
    // )
 })

export default registeruser ;