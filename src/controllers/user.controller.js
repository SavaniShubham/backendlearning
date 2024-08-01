import jwt from "jsonwebtoken";
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


 const generateAccessAndRefreshToken = async (userId)=>
 {
   try {
      const user = await User.findById(userId);
      console.log("this line  !!");
      const accessToken = user.generateAccessToken();
      console.log("this line  !!");
      const refreshToken = user.generateRefreshToken();
      console.log("this line  !!");
      console.log(`access token :${accessToken} , refresh token : ${refreshToken}`)

      user.refreshToken = refreshToken;
       await user.save({validateBeforeSave : false })

       return {accessToken , refreshToken};
      
   } catch (error) {
      throw new ApiError(500,"Something went wrong while genrating Access and Refresh Token")
   }

 }
 
 const loginuser =asyncHandler(async (req , res)=>
 {
   // step -1 get data from req body
   console.log(req.body);

   const {username , password , email }=req.body;
   if (!(username || email)) 
   {
      throw new ApiError(400 , "username or email is required")
   }


   // step-2 check username or email based
    //find the user

    const user = await User.findOne(
      {
         $or:[{email} ,{username}]
      }
       )
        console.log(user);
       if (!user) {
               throw new ApiError(404,"User does't exist");
            }

   // step - 3 password check
          const isPasswordValid =  await user.isPasswordCorrect(password);

          if (!isPasswordValid) {
            throw new ApiError(401,"Invalid User Credentials");
                  }


   // step -4 access and refreshtoken generate and give to user
         const {accessToken , refreshToken } =  await generateAccessAndRefreshToken(user._id);
         console.log(`access token :${accessToken} , refresh token : ${refreshToken}`)

   const loggedInuser = await User.findById(user._id).select("-password -refreshToken");

   
   // step-5 send token in cookie and return response to the user
   const options = 
   {
      httponly:true ,
      secure:true,
   }
            return res.
                      status(200)
                      .cookie("accessToken" , accessToken , options)
                      .cookie("refrehsToken" ,refreshToken , options)
                      .json(
                        new ApiResponse(200 , 
                           {
                              user:loggedInuser ,
                              accessToken,
                              refreshToken,
                           },
                           "User Logged In Successfully"
                        )
                      )
 })

 const logOutUser = asyncHandler (async (req , res)=>
         {
            console.log(req.user);
            const userid = req.user._id;

            
        console.log("this line !!!");
           await User.findByIdAndUpdate(userid , 
               {
                  $set:{refreshToken : undefined}
               },
               {
                  new:true,
               }
            )
            const options = 
            {
               httponly:true ,
               secure:true,
            }

            return res.status(200).
                  clearCookie("accessToken" , options).
                  clearCookie("refrshToken",options).
                  json(new ApiResponse(200 , {} , "User LogOut Suceesfully "))
                                  
         
             
         })

 const refreshAccessToken = asyncHandler(async (req , res)=>
   {
      const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

      if (!incomingRefreshToken) {
         throw new ApiError(401,"Unauthrized Request !");
      }
      try {
   
         const decodedtoken = jwt.verify(incomingRefreshToken , process.en.REFRESH_TOKEN_SECRET)
   
          const user = await User.findById(decodedtoken?._id);
   
          if (!user) {
            throw new ApiError(401,"Invalid refreshToken");
         }
   
         if (incomingRefreshToken !== user?.refreshToken)
         {
            throw new ApiError(401 , "Refresh Token is Used or Expired")
            
         }
   
         const {accessToken , newrefreshToken }=  await generateAccessAndRefreshToken(user._id);
   
           const options = 
           {
              httponly:true ,
              secure:true,
           }
   
           return res.status(200).
                      cookie("accessToken" ,accessToken ,options).cookie("refrshToken",newrefreshToken,options).
                     json(new ApiResponse(
                        200,
                        {
                           accessToken ,
                           refreshToken : newrefreshToken,
                        },
                        "AccessToken Refreshed Successfully"
                     ))
            } catch (error) {
               throw new ApiError(401 , error?.message || "Invalid RefrshToken ")
   
            }


   })


const changeCurrentPassword = asyncHandler(async(req , res)=>
{
   const {oldPassword , newPassword , confirmPassword}=req.body

    const user =  await User.findById(req?.user._id);
   const ispasswordcorrect = await user.isPasswordCorrect(oldPassword);
   if (!ispasswordcorrect)
   {
      throw new ApiError(400 , "Invalid Password")  
   }

   if (newPassword !==confirmPassword) 
   {
      throw new ApiError(400 , "Invalid Password")  
   }

   user.password = confirmPassword
    await user.save({validateBeforeSave:false});

    return res.status(200).json(new ApiResponse(200 , {} , "Password Changed Successfully"));
})


const getCurrentUser = asyncHandler(async (req , res)=>
{
   const user = await req.user ;

   return res.status(200).
              json(200 , user , "Current User fetched Successfully")

}) 

const updateAccountDetails = asyncHandler( async(req , res)=>
{
   const {fullname , email }=req.body;

   if (!(fullname &&  email))
   {
      throw new ApiError(400 , "All Fiedls are required");
   }
   const user = User.findByIdAndUpdate( req.user?._id,
      {
         $set:
         {
            fullname,
            email,
         }
      },
      {new : true}

   ).select("-password")

   return res.status(200).
              json(new ApiResponse(200 , user , "Account Details updated Successfully"))
  
})

const updateUserAvatar =asyncHandler(async (req , res)=>
{
   const avatarLocalPath =req.file?.path;

   if (!avatarLocalPath) {
      throw new ApiError(400 , "Avatar File is missing");
   }

    const avatar =await uploadoncloudinary(avatarLocalPath);
    if (!avatar?.url) {
      throw new ApiError(400 , "Error While uploading Avatar "); 
    }

   const user = await User.findByIdAndDelete(req.user?._id,
      {
         $set:
         {
            avatar:avatar?.url ,
         }

      },
      {
         new:true
      }
    ).select("-password")

    return res.status(200).
               json(new ApiResponse(200 , user , "Avatar Updated Successfully"))

})

const updateUserCoverImage =asyncHandler(async (req , res)=>
   {
      const coverImageLocalPath =req.file?.path;
   
      if (!coverImageLocalPath) {
         throw new ApiError(400 , "coverImage File is missing");
      }
   
       const coverImage =await uploadoncloudinary(coverImageLocalPath);
       if (!coverImage?.url) {
         throw new ApiError(400 , "Error While uploading coverImage "); 
       }
   
      const user = await User.findByIdAndDelete(req.user?._id,
         {
            $set:
            {
               coverImage:coverImage?.url || "" ,
            }
   
         },
         {
            new:true
         }
       ).select("-password")
   
       return res.status(200).
                  json(new ApiResponse(200 , user , "CoverImage Updated Successfully"))
   
   })
   
export default registeruser ;
export {loginuser , logOutUser , refreshAccessToken , changeCurrentPassword , getCurrentUser ,updateAccountDetails , updateUserAvatar , updateUserCoverImage };