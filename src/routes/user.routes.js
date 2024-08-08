import { Router } from "express";
import registeruser, { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginuser, logOutUser, refreshAccessToken, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        //get the data of image from user

        {
            name:"avatar",
            maxCount:1,
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registeruser);

    const message =async (req , _, next)=>
    {
       console.log("route to login suceessfully");
        next();

    }

router.route("/login").post( message, loginuser)

//secured routes

router.route("/logout").post( verifyJWT, logOutUser)

router.route("/refresh-token").post(refreshAccessToken)

// router.route("/update-avatar").post(verifyJWT , upload.single("avatar"),updateUserAvatar)

router.route("/change-password").post(verifyJWT , changeCurrentPassword);

router.route("/current-user").get(verifyJWT , getCurrentUser);

router.route("/update-account").patch(verifyJWT , updateAccountDetails);

router.route("/update-avatar").patch(verifyJWT , upload.single("avatar") , updateUserAvatar)

router.route("/update-coverimage").patch(verifyJWT , upload.single("coverImage") , updateUserCoverImage)

router.route("/channel/:username").get(verifyJWT , getUserChannelProfile);

router.route("/history").get(verifyJWT , getWatchHistory);



export default router ;