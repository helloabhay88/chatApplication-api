import userModel from "../models/user.js"
import Message from "../models/Message.js"
import Conversation from "../models/Conversation.js"

const users = async (req, res) => {
    try {
        const loginUser = req.user._id
        const allUser = await userModel.find({_id:{$ne:loginUser}}).select('-password').lean()
        
        const usersWithUnreadCount = await Promise.all(allUser.map(async (user) => {
            const conversation = await Conversation.findOne({
                participants: { $all: [loginUser, user._id] }
            });
            let unreadCount = 0;
            if (conversation) {
                unreadCount = await Message.countDocuments({
                    conversationId: conversation._id,
                    sender: user._id,
                    seen: false
                });
            }
            return { ...user, unreadCount };
        }));

        return res.status(200).json({ message: 'success', users: usersWithUnreadCount })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: error })
    }

}
export default users