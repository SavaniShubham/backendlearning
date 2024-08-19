import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
// import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id;

    if (!userId) {
       throw new ApiError(400 , "userId is requried")
    }

    // Get total subscribers
    // const  totalSubscribers = await User.findById(userId).select("subscribersCount");

     // Get total subscribers using Subscription model
     const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    
   // Get total videos
   const totalVideos = await Video.countDocuments({ owner: userId });

   // Get total views from videos
   const totalViews = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } }
]);
    const totalVideoViews = totalViews.length > 0 ? totalViews[0].totalViews : 0;

    // Get total likes
    const totalLikes = await Like.countDocuments({ likedBy: userId });
    
     // Return the statistics
     return res.status(200).json(new ApiResponse(200, {
        totalSubscribers,
        totalVideos,
        totalVideoViews,
        totalLikes
    }, "Channel stats retrieved successfully"));
    
})


const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "userId is required");
    }

    // Fetch all videos uploaded by the user
    const videos = await Video.find({ owner: userId });

    if (videos.length === 0) {
        // No videos found
        return res.status(404).json(new ApiResponse(404, [], "No videos found for this channel"));
    }

    // Return the videos
    return res.status(200).json(new ApiResponse(200, videos, "Videos retrieved successfully"));
});



export {
    getChannelStats, 
    getChannelVideos
    }