import userModel from "../models/user.js"

const users = async (req, res) => {
    try {
        const loginUser = req.user._id
        const allUser = await userModel.find({_id:{$ne:loginUser}}).select('-password')
        return res.status(200).json({ message: 'success', users: allUser })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: error })
    }

}
export default users