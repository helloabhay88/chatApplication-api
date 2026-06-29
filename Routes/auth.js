import express from 'express'
import { changePassword, forgotPassword, Login, Register,resetPassword,upload,verify, getCurrentUser, updateProfile } from '../controllers/authController.js'
import verifyUser from '../middleware/verifyUser.js'
import users from '../controllers/userController.js'
const router=express.Router()

router.post('/register',upload.single('image'),Register )
router.post('/',Login )
router.post('/forgot-verify',forgotPassword )
router.get('/:id/:token',resetPassword )
router.post('/:id/:token',changePassword )
router.get('/verify',verifyUser,verify)
router.get('/me',verifyUser,getCurrentUser)
router.put('/profile',verifyUser,upload.single('image'),updateProfile)

export default router