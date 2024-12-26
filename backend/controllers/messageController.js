import Conversation from "../models/conversationModel.js";
import Message from "../models/messageMode.js";
import { getRecipientSocketId } from "../socket/socket.js";
import { io } from "../socket/socket.js";

const sendMessage = async(req, res)=>{ 
    try {
        const { reciverId , message } = req.body;
        const senderId = req.user._id;
        let conversation  =  await Conversation.findOne({
            participants: { $all: [senderId, reciverId] }
        })
        if(!conversation){
            conversation = new Conversation({
                participants:[senderId, reciverId],
                lastMessages:{
                    sender:senderId,
                    text:message,
                }
            })
            await conversation.save();
        }
        
        const newMessage = new Message({
            conversationId:conversation._id,
            sender:senderId,
            text:message,
        })

        await Promise.all ([
            newMessage.save(),
            conversation.updateOne({
                lastMessages:{
                    sender:senderId,
                    text:message,
                }
            }),
        ])        
        
        const recipientSocketId = getRecipientSocketId(reciverId);
        console.log(recipientSocketId)
        if(recipientSocketId){
            io.to(recipientSocketId).emit('newMessage', newMessage);
        }
        
        res.status(201).json(newMessage);
        
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message });
    }
}

const getMessage = async(req, res)=>{
    try {
        const { otheruserId } = req.params;
        const senderId = req.user._id;
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, otheruserId] }
        })
        if(!conversation){
            return res.status(404).json({ error: 'Conversation not found' });
        }
        const messages = await Message.find(
            { conversationId: conversation._id }
        ).sort({createdAt:1})

        res.status(200).json(messages);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message });
    }

}


const getConversation = async(req,res)=>{
    const userId = req.user._id
    try {
        const conversations = await Conversation.find({
            participants: userId
        }).populate(
            {
                path: 'participants',
                select: 'username profilePic',
            },        
        )

        //remove the current user from the participants list
        conversations.forEach((c) => c.participants = c.participants.filter((p) => p._id.toString()!==userId.toString()));

        res.status(200).json(conversations);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message });
    }
}

export  {sendMessage ,getMessage ,getConversation};