import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import  ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"



const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid or missing Channel ID");
    }

     // Check if the channel exists
     const channel = await User.findById(channelId);
     if (!channel) {
         throw new ApiError(404, "Channel not found");
     }

    // Check if the subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId,
    });

    if (existingSubscription) {
        // If the subscription exists, delete it (unsubscribe)
        await existingSubscription.remove();
        // Decrease the subscription count for the user
        await User.findByIdAndUpdate(req.user._id, { $inc: {  channelSubscribedToCount: -1 } });
        return res.status(200).json(new ApiResponse(200, null, "Unsubscribed successfully"));
    } else {
        // If the subscription does not exist, create a new one (subscribe)
        const newSubscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId,
        });
        // Increase the subscription count for the user
        await User.findByIdAndUpdate(req.user._id, { $inc: {  channelSubscribedToCount: 1 } });
        return res.status(200).json(new ApiResponse(200, newSubscription, "Subscribed successfully"));
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid or missing Channel ID");
    }

    const subscriberlist = await Subscription.find({channel:channelId}).populate("subscriber", "username ");

    if (subscriberlist == 0)
    {
        throw new ApiError(404 , "No Subscribers  found")
    }
    return res.status(200).json(new ApiResponse(200, subscriberlist, "SubscriberList  retrived successfully"));

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    console.log(subscriberId);

    if (!subscriberId) {
        throw new ApiError(400, "Invalid  Subscriber ID");
    }
    if ( !isValidObjectId(subscriberId)) {
        throw new ApiError(400, " missing Subscriber ID");
    }

    const subscribedChannelList = await Subscription.find({subscriber:subscriberId}).populate("channel", "username ");;

    if (subscribedChannelList.length === 0) {
        throw new ApiError(404, "No subscribed channels found");
    }
        return res.status(200).json(new ApiResponse(200, subscribedChannelList, "SubscribedChannels  retrived successfully"));

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}