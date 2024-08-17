import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import uploadOnCloudinary from "../utils/cloudinary.js"

 
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {

    //step 1 get the data and check the data and check thata is alreadypublished or not
    const { title, description} = req.body
       // TODO: get video, upload to cloudinary, create video

    if (!(title && description))
    {
        throw new ApiError(400 , "video title and description is required")   
    }

   const existetvideo = await Video.findOne(
        {
        $or : [{title} , {description}]
        }
    )
    if (existetvideo)
        {
            throw new ApiError(409 , "video with title and description is already published")   
        }

        //step -2 get the path from local and upload it  on the cloudinary

        console.log(req.files);
        console.log(req.files.videoFile);
        console.log(req.files.thumbnail);

        const videoFileLocalPath  = req.files?.videoFile[0]?.path;
        const thumbnailLocalPath  = req.files?.thumbnail[0]?.path;
        console.log(videoFileLocalPath , thumbnailLocalPath );

        if (!videoFileLocalPath) 
        {
            throw new ApiError(400 , "video file is required");
      
        }
        if (!thumbnailLocalPath) 
            {
                throw new ApiError(400 , "video file is required");
            }
        
        const videoFile =  await uploadOnCloudinary(videoFileLocalPath);
        const thumbnail =  await  uploadOnCloudinary(thumbnailLocalPath);
        console.log(videoFile);
        console.log(thumbnail);
        if (!videoFile) 
            {
                throw new ApiError(400 , "video file is required");
            }
        if (!thumbnail) {
            throw new ApiError(400 , "video file is required");
        }

        //step -3 create video
        const ownerId = req.user._id;

        // const owner = await User.findById(ownerId).select("fullname username avatar");
        // if (!owner) {
        //     throw new ApiError(404, "Owner not found");
        // }

        const ownerDetails = await User.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(ownerId) } },
            {
                $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                }
            }
        ]);
        if (ownerDetails.length === 0) {
            throw new ApiError(404, "Owner not found");
        }
    
        const owner = ownerDetails[0]; // Since aggregation returns an array
        console.log(owner);
        const video = await  Video.create(
            {
                videoFile:videoFile.url || "",
                thumbnail:thumbnail.url || "",
                title,
                description,
                isPublished:true,
                duration:videoFile.duration,
                owner:ownerId,
                views:0,
            }
        )

        return res.status(201).json(
            new ApiResponse(201 , video , "video is Published Successfully")
        )

})

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(404, " Video ID is required");
    }
    
    const video =  await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200)
              .json( new ApiResponse(200 , video , "video fetched Successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {

    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params
    const {title , description } =req.body;

    const thumbnailLocalPath  = req.file?.path;
    if (!videoId) {
        throw new ApiError(400, " Video ID is required");
    }
    
    if (!(title  && description && thumbnailLocalPath)) {
        throw new ApiError(400, " All fields are  requried");
    }

    const thumbnailnew =  await  uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnailnew?.url) {
        throw new ApiError(400 , "Error While uploading Thumbnail "); 
      }


    const video =  await Video.findByIdAndUpdate(videoId , 
        {
        $set:
        {
            title , 
            description,
            thumbnail:thumbnailnew?.url || ""
        },
       },
       { new: true } 
    )
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200)
              .json( new ApiResponse(200 , video , "video updated Successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId) {
        throw new ApiError(400, " Video ID is required");
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);
    console.log(deleteVideo);

    if (!deletedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(
        new ApiResponse(200, deletedVideo, "Video deleted successfully")
    );
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, " Video ID is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: { isPublished: !video.isPublished } },
        { new: true } 
    ).select("title isPublished thumbnail");

       return res.status(200).json(
        new ApiResponse(200, updatedVideo , "Video  publish status toggled successfully")
    );

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}