import multer from "multer"
import path from "path"
import userModel from "../models/user.js"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from "../cloudinary.js"
import nodemailer from 'nodemailer'
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
            return res.status(400).json({ message: "Email or Password is incorrect" })
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

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        console.log("Incoming email:", email);

        const userExist = await userModel.findOne({ email });
        if (!userExist) {
            console.log("User not found:", email);
            return res.status(400).json({ message: "User with this email does not exist" });
        }

        const secret = process.env.JWT_KEY + userExist.password;
        const token = jwt.sign(
            { id: userExist._id, email: userExist.email },
            secret,
            { expiresIn: "5m" }
        );

        const link = `https://chatapplication-api.onrender.com/reset-password/${userExist._id}/${token}`;
        console.log("Reset link:", link);

        // -------------------------
        // 🔥 BREVO SMTP TRANSPORTER
        // -------------------------
        let transporter = nodemailer.createTransport({
            host: process.env.BREVO_HOST,
            port: process.env.BREVO_PORT,
            secure: false, // port 587 → secure:false
            auth: {
                user: process.env.BREVO_USER,
                pass: process.env.BREVO_PASS
            }
        });

        let mailOptions = {
            from: `Socketmate <${process.env.EMAIL}>`,   // your Gmail as sender
            to: email,
            subject: "Password Reset Request for Socketmate",
            text: `Click the link below to reset your password:\n\n${link}`
        };
        transporter.verify((err, success) => {
    if (err) {
        console.log("❌ SMTP VERIFY ERROR:", err);
    } else {
        console.log("✅ SMTP READY");
    }
});

        await transporter.sendMail(mailOptions);

        console.log("Password reset email sent to:", email);

        return res.status(200).json({
            message: "Email sent successfully",
            link: link
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

async function resetPassword(req, res) {
    try {
        const { id, token } = req.params;
        const userExist = await userModel.findById(id);
        if (!userExist) {
            return res.status(400).json({ message: "User not found" });
        }
        const secret = process.env.JWT_KEY + userExist.password;
        try {
            const verify = jwt.verify(token, secret);
            console.log(verify);
            return res.redirect(
                `https://socketmate.vercel.app/reset-password/${id}/${token}`
            );

        } catch (error) {
            console.log(error);
            if (error.name === "TokenExpiredError") {
                return res.send(`
        <script>
            alert("Reset link expired. Please request a new one.");
            window.location.href = "https://socketmate.vercel.app/";
        </script>
    `);
            }
            if (error.name === "JsonWebTokenError") {
                res.send(`
                    <script>
                        alert("Invalid Link, Please request a new one.");
                        window.location.href="https://socketmate.vercel.app/";
                    </script>`)
            }
            if (error.name === "SyntaxError") {
                res.send(`
                    <script>
                        alert("Invalid Link, Please request a new one.");
                        window.location.href="https://socketmate.vercel.app/";
                    </script>`)
            }
            return res.status(400).json({ message: "invalid token" });
        }
    } catch (error) {

    }
}

async function changePassword(req, res) {
    try {
        const { id, token } = req.params;
        const { password } = req.body;
        const userExist = await userModel.findById(id);
        if (!userExist) {
            return res.status(400).json({ message: "user not found" });
        }
        const secret = process.env.JWT_KEY + userExist.password;
        try {
            jwt.verify(token, secret);
            const hashpassword = await bcrypt.hash(password, 10);
            userExist.password = hashpassword;
            await userExist.save();
            return res.status(200).json({ message: "password changed successfully" });
        }
        catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(400).json({ message: "Reset Link Expired" })
            }
            if (error.name === "JsonWebTokenError") {
                return res.status(400).json({ message: "Invalid Token" })
            }
            console.log(error)
            return res.status(400).json({ message: "Token verification failed" })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "error" + error })
    }
}
const verify = (req, res) => {
    return res.status(200).json({ message: 'success' })
}

export { Register, Login, verify, forgotPassword, resetPassword, changePassword }