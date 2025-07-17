import jwt from 'jsonwebtoken'
import userModel from '../models/user.js';
const verifyUser=async(req,res,next)=>{
    try {
         const token=req.headers.authorization.split(' ')[1];
         if(!token){
            return res.status(401).json({message:"unauthorized"})
         }
         const decoded=jwt.verify(token,process.env.JWT_KEY)
         if(!decoded){
            return res.status(401).json({message:"Token not valid"})
         }
         const user=await userModel.findOne({_id:decoded.id}).select('-password')
         req.user=user;
        next()
    } catch (error) {
        console.log(error)
    }
   
}
export default verifyUser