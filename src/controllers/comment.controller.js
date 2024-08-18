import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
 
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!videoId) {
        throw new ApiError(400, "videoId is required");
    }

    // Check if the video exists
    const videoExists = await Video.exists({ _id: videoId });
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    // Fetch comments with pagination
    const comments = await Comment.find({ video: videoId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('owner', 'fullname username avatar')
        .exec();

    // Get the total number of comments for pagination
    const totalComments = await Comment.countDocuments({ video: videoId });

    return res.status(200).json(new ApiResponse(200, {
        comments,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalComments / limit),
        totalComments,
    }, "Comments retrieved successfully"));
});


const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { commentContent } = req.body;

    if (!videoId) {
        throw new ApiError(400, "videoId is required");
    }
    if (!commentContent) {
        throw new ApiError(400, "commentContent is required");
    }

    const ownerId = req.user._id;

    // Fetch owner details
    const owner = await User.findById(ownerId).select('fullname username avatar');
    if (!owner) {
        throw new ApiError(404, "Owner not found");
    }

    // Fetch video details
    const video = await Video.findById(videoId).select('title videoFile thumbnail');
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Create the comment
    const comment = await Comment.create({
        content: commentContent,
        video: videoId,
        owner: ownerId,
    });

    return res.status(200).json(new ApiResponse(200, comment, "Comment added successfully"));
});


const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { newContent } = req.body;

    if (!commentId) {
        throw new ApiError(400, "commentId is required");
    }
    if (!newContent) {
        throw new ApiError(400, "newContent is required");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { content: newContent },
        { new: true }
    );

    if (!updatedComment) {
        throw new ApiError(404, "Comment not found");
    }

    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});


const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
   

    if (!commentId) {
        throw new ApiError(400, "commentId is required");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if (!deletedComment) {
        throw new ApiError(404, "Comment not found");
    }

    return res.status(200).json(new ApiResponse(200, deletedComment, "Comment deleted successfully"));

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }