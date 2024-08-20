import { Router } from 'express';
import {
    getSubscribedChannels,
 
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file


// Route for toggling subscription and getting details about a specific channel
router
    .route("/c/:channelId")
    .post(toggleSubscription);

// Route for fetching a user's subscribers
router.route("/u/:channelId/subscribers").get(getUserChannelSubscribers);

// Route for fetching channels a user is subscribed to
router.route("/u/:subscriberId/channels").get(getSubscribedChannels);

export default router
