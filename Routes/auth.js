import express from 'express'
import { Login, Register,upload,verify } from '../controllers/authController.js'
import verifyUser from '../middleware/verifyUser.js'
import users from '../controllers/userController.js'
const router=express.Router()

router.post('/register',upload.single('image'),Register )
router.post('/',Login )
router.get('/verify',verifyUser,verify)

export default router