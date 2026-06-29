import mongoose from "mongoose";

const messageSchema=new mongoose.Schema({
    conversationId: {type: mongoose.Schema.Types.ObjectId,ref:"Conversation",required:true},
    sender:{type: mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    content:{type:String,required:false},
    messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    fileUrl: { type: String },
    fileName: { type: String },
    seen: {type:Boolean,default:false}
},{
    timestamps:true
})

const Message=mongoose.model('Message',messageSchema)

export default Message