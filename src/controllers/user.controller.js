import jwt from "jsonwebtoken";
import { User } from "../modules/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadoncloudinary, { deleteFromCloudinaryByUrl } from "../utils/cloudinary.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Subscription } from "../modules/subscription.model.js";
import mongoose from "mongoose";

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
                      .cookie("refreshToken" ,refreshToken , options)
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
                  // $set:{refreshToken : undefined}
                  $unset:
                  {
                     refreshAccessToken:1 // this remove the field from document
                  }
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
                  clearCookie("refreshToken",options).
                  json(new ApiResponse(200 , {} , "User LogOut Suceesfully "))
                                  
         
             
         })

 const refreshAccessToken = asyncHandler(async (req , res)=>
   {
      const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
      console.log(incomingRefreshToken);

      if (!incomingRefreshToken) {
         throw new ApiError(401,"Unauthrized Request !");
      }
      try {
   
         const decodedtoken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
         console.log(decodedtoken);
   
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
              json( new ApiError (200 , user , "Current User fetched Successfully"))

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
   console.log( "request file " , req.file);
   console.log("user : " , req.user);
   const avatarLocalPath =req.file.path;
   console.log("Avatar localpath :" ,avatarLocalPath );

   if (!avatarLocalPath) {
      throw new ApiError(400 , "Avatar File is missing");
   }

    const avatar =await uploadoncloudinary(avatarLocalPath);
    if (!avatar?.url) {
      throw new ApiError(400 , "Error While uploading Avatar "); 
    }

    const oldAvatarurl = await User.findById(req.user._id).select("avatar");
    console.log(oldAvatarurl);
    if (oldAvatarurl) {
      console.log("old url getted !!")
      deleteFromCloudinaryByUrl(oldAvatarurl);
      console.log("old avatar image remove successfully")

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
    console.log(user);

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


   const getUserChannelProfile = asyncHandler(async (req, res, next) => {
      const { username } = req.params;
      if (!username?.trim()) {
         throw new ApiError(400, "Username is missing")
      }
   
      const channel = await User.aggregate([
         {
            $match: {
               username: username.toLowerCase(),
            },
         },
         {
            $lookup: {
               from: "subscriptions",
               localField: "_id",
               foreignField: "channel",
               as: "subscribers",
            },
         },
         {
            $lookup: {
               from: "subscriptions",
               localField: "_id",
               foreignField: "subscriber",
               as: "subscribedTo",
            },
         },
         {
            $addFields: {
               subscribersCount: {
                  $size: "$subscribers",
               },
               channelSubscribedToCount: {
                  $size: "$subscribedTo",
               },
               isSubscribed: {
                  $cond: {
                     if: {
                        $in: [req.user?._id, "$subscribers.subscriber"],
                     },
                     then: true,
                     else: false,
                  },
               },
            },
         },
         {
            $project: {
               fullname: 1,
               username: 1,
               subscribersCount: 1,
               channelSubscribedToCount: 1,
               isSubscribed: 1,
               avatar: 1,
               coverImage: 1,
               email: 1,
            },
         },
      ]);

      console.log(channel);
   
      if (!channel?.length) {
         return next(new ApiError(404, "Channel does not exist"));
      }
   
      return res.status(200).json(
         new ApiResponse(200, channel[0], "User channel fetched successfully")
      );
   });


   const getWatchHistory = asyncHandler(async (req , res , next)=>
   {
      const user =await User.aggregate([
         {
            $match:
            {
               _id:new mongoose.Types.ObjectId(req.user._id)//before we write direct _id=req.user._id(beacause here mongoose convert string into the mongodb id automatically) b ut in aggregation it can't done directly so convert that string to mongodb id and then assign it
            }
         },
         {
            $lookup:
            {
               from:"videos",
               localField:"watchHistory",
               foreignField:"_id",
               as:"watchHistory",
               pipeline:
               [
                  {
                  $lookup:
                  {
                     from:"users",
                     localField:"owner",
                     foreignField:"_id",
                     as:"owner",
                     pipeline:[
                        {
                           $project:
                           {
                              fullname:1,
                              username:1,
                              avatar:1,
                           }
                        }
                     ]
                  },
                  },
                  {
                     $addFields:
                     {
                        owner:
                        {
                           $first:"$owner"
                        }
                     }
                  }

               ]
            }
         },
        
      ])

      console.log(user);

      return res.status(200).json(new ApiResponse(200 , user[0].watchHistory , "Watch History fetch successfully"))
   })
   
   
export default registeruser ;
export {loginuser , logOutUser , refreshAccessToken , changeCurrentPassword , getCurrentUser ,updateAccountDetails , updateUserAvatar , updateUserCoverImage , getUserChannelProfile , getWatchHistory };