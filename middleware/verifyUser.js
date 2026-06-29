import jwt from 'jsonwebtoken'
import userModel from '../models/user.js';

const verifyUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "unauthorized" });
        }
        
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_KEY);
        if (!decoded) {
            return res.status(401).json({ message: "Token not valid" });
        }

        const user = await userModel.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("verifyUser authentication error:", error.message);
        return res.status(401).json({ message: "unauthorized" });
    }
};

export default verifyUser;