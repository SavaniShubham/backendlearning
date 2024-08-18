import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body ;

    if (!content) {
        throw new ApiError(400, "Tweet content is required");
    }

    // Check if a tweet with the same content already exists
    const existingTweet = await Tweet.findOne({ content });
    if (existingTweet) {
        throw new ApiError(409, "Tweet already exists");
    }

    const tweet = await Tweet.create(
        {
            content,
            owner:req.user_id
        }
    )
   
    if (!tweet) {
        throw new ApiError(500, "Something went wrong while creating the tweet");
    }

    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"));


})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const {userId} = req.params ;
    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid or missing user ID");
    }

    const user = await User.findById(userId).select("username fullname avatar");

    if (!user) {
        throw new ApiError(404, "user not found");
    }

    const tweets = await Tweet.find({owner:user._id}).select("content");

    if (!tweets) {
        throw new ApiError(400, "No tweet exist");
    }

    return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
})


const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid or missing tweet ID");
    }

    if (!content) {
        throw new ApiError(400, "Tweet content is required");
    }

    // Find the tweet to ensure it exists
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // Update the tweet
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, 
        { $set: { content } },
        { new: true }
    );

    if (!updatedTweet) {
        throw new ApiError(500, "Something went wrong while updating the tweet");
    }

    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params;
    
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid or missing tweet ID");
    }

     // Find the tweet to ensure it exists
     const tweet = await Tweet.findById(tweetId);
     if (!tweet) {
         throw new ApiError(404, "Tweet not found");
     }
 
     // Update the tweet
     const deletedtweet = await Tweet.findByIdAndDelete(tweetId);

     if (!deletedtweet) {
        throw new ApiError(500, "Something went wrong while deleting the tweet");
    }

    return res.status(204).json(new ApiResponse(204, deletedtweet, "Tweet deleted successfully"));

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}