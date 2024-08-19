import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"



const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist

    if (!name || !description) {
        throw new ApiError(400, "All fields are required");
    }

    const ownerdetails = await Video.findById(req.user._id).select("username fullname avatar");
    if (!ownerdetails) {
        throw new ApiError(404, "Owner not found");
    }
    const playlist = await Playlist.create(
        {
            name,
            description,
            owner:ownerdetails._id,
        }
    )

    if (!playlist)
    {
        throw new ApiError(500 , "Something went wrong while creating the playlist")
    }

    return res.status(201).json( new ApiResponse(201 , playlist , "playList created successfully"));

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "userId required");
    }

    const playlists =  await Playlist.find({owner : userId});

        // Check if no playlists are found
        if (playlists.length === 0) {
            throw new ApiError(404, "No playlists found for the user");
        }
    
    return res.status(200).json( new ApiResponse(200 , playlists , "user playlists retrived successfully"));


})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Validate playlistId
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Valid playlistId is required");
    }

    // Fetch the playlist by ID
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "No playlist found");
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist retrieved successfully"));



})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    
    if (!playlistId || !videoId) {
        throw new ApiError(400, "All fields are required");
    }

    const videodetails = await Video.findById(videoId);
    if (!videodetails) {
        throw new ApiError(404, "Video not found");
    }

    const playList =  await Playlist.findByIdAndUpdate(playlistId , 
        { $push: { Videos: videodetails._id } },
        { new: true }
    )

    if (!playList)
        {
            throw new ApiError(500 , "Something went wrong while adding the videos to the playlist")
        }

        return res.status(200).json( new ApiResponse(200 , playList , "Video added to playList successfully"));

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (!playlistId || !videoId) {
        throw new ApiError(400, "All fields are required");
    }

    const playList = await Playlist.findById(playlistId);

    if (!playList) {
        throw new ApiError(404, "No playlist found");
    }

    playList.Videos.pull(videoId);

     await playList.save();

     return res.status(200).json( new ApiResponse(200 , playList , "Video removed from playList successfully"));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if (!playlistId ) {
        throw new ApiError(400, "All fields are required");
    }

    const playList =  await Playlist.findByIdAndDelete(playlistId);

    if (!playList) {
        throw new ApiError(404 , "No playList found")
    }

    return res.status(200).json( new ApiResponse(200 , playList , "playList deleted successfully"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

 
    if (!playlistId || !isValidObjectId(playlistId)) {
         throw new ApiError(400, "Valid playlistId is required");
        }
    
    if (!name || !description) {
        throw new ApiError(400, "All fields are required");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId , 
        {
            name , 
            description,
        },
        {
            new:true
        }
    )

    if (!updatedPlaylist)
        {
            throw new ApiError(500 , "Something went wrong while updating the playlist")
        }
    
        return res.status(200).json( new ApiResponse(200 , updatedPlaylist , "playList updated successfully"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}