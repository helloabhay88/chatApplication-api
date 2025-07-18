import multer from "multer"
import path from "path"
import userModel from "../models/user.js"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import {CloudinaryStorage} from 'multer-storage-cloudinary'
import cloudinary from "../cloudinary.js"
// const storage = multer.diskStorage({
//     destination: (req, res, cb) => {
//         cb(null, 'public/images')
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
//     }
// })

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chatApplication_uploads',
    allowed_formats: ['jpg', 'png'],
    public_id: (req, file) => `${file.fieldname}-${Date.now()}`,
  },
});
export const upload = multer({ storage: storage })

async function Register(req, res) {
    try {
        const { email, password, name } = req.body
        let file;
        if (req.file) {
            file = req.file.filename
            console.log(file)
        }
        const userExist = await userModel.findOne({ email })
        if (userExist) {
            return res.status(400).json({ message: "User already exists" })
        }
        const hashpassword = await bcrypt.hash(password, 10)
        const newUser = new userModel({
            email,
            password: hashpassword,
            name,

        })
        if (file) {
            newUser.image = file
        }
        await newUser.save()
        return res.status(200).json({ message: "success" })
    } catch (error) {
        return res.status(500).json({ message: "error" + error })
    }

}

async function Login(req, res) {
    try {
        const { email, password } = req.body
        const userExist = await userModel.findOne({ email })
        if (!userExist) {
            return res.status(400).json({ message: "User not exists" })
        }
        const matchPassword = await bcrypt.compare(password, userExist.password)
        if (!matchPassword) {
            return res.status(400).json({ message: "Invalid password" })
        }
        const token = jwt.sign({ id: userExist._id }, process.env.JWT_KEY, {
            expiresIn: '24h'
        })
        return res.status(200).json({ message: "success", token, user: { id: userExist._id, email: userExist.email } })
    } catch (error) {
        return res.status(500).json({ message: "error" + error })
    }

}
const verify = (req, res) => {
    return res.status(200).json({ message: 'success' })
}

export { Register, Login, verify }