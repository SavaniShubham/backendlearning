import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
 
const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

   
    const userId = req.user._id;

    // Validate videoId
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Valid videoId is required");
    }

    // Find an existing like
    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

    if (existingLike) {
        // If a like exists, remove it
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, null, "Like removed from video"));
    } else {
        // If no like exists, add a new like
        const newLike = await Like.create({
            video: videoId,
            likedBy: userId
        });
        return res.status(201).json(new ApiResponse(201, newLike, "Video liked successfully"));
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    const userId = req.user._id;

    // Validate commentId
    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Valid commentId is required");
    }

    // Find an existing like
    const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });

    if (existingLike) {
        // If a like exists, remove it
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, null, "Like removed from comment"));
    } else {
        // If no like exists, add a new like
        const newLike = await Like.create({
            comment: commentId,
            likedBy: userId
        });
        return res.status(201).json(new ApiResponse(201, newLike, "comment liked toggled  successfully"));
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId = req.user._id;

    // Validate videoId
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Valid tweetId is required");
    }

    // Find an existing like
    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

    if (existingLike) {
        // If a like exists, remove it
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, null, "Like removed from tweet"));
    } else {
        // If no like exists, add a new like
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: userId
        });
        return res.status(201).json(new ApiResponse(201, newLike, "tweet liked  successfully"));
    }

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user._id;

    const result =await  Like.aggregate([
        {
            $match:
            {
                likedBy:new mongoose.Types.ObjectId(userId),
                video:{$ne : null}
            }
        } , 
        {
            $lookup:
            {
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videodetails"
            }
        },
        {
            $project:
            {
                _id:0,
                videodetails:{$arrayElemAt: ["$videodetails" , 0 ]},
            }
        }
    ]);
    if (result.length === 0) {
        // No liked videos found
        return res.status(404).json(new ApiResponse(404, [], "No liked videos found"));
    }

    // Return the liked videos
    return res.status(200).json(new ApiResponse(200, result.map(doc => doc.videodetails), "Liked videos retrieved successfully"));

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}