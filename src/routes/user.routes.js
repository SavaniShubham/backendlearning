import { Router } from "express";
import registeruser, { loginuser, logOutUser, refreshAccessToken } from "../controllers/user.controller.js";
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


export default router ;