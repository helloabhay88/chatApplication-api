import express from 'express'
import { changePassword, forgotPassword, Login, Register,resetPassword,upload,verify } from '../controllers/authController.js'
import verifyUser from '../middleware/verifyUser.js'
import users from '../controllers/userController.js'
const router=express.Router()

router.post('/register',upload.single('image'),Register )
router.post('/',Login )
router.post('/forgot-verify',forgotPassword )
router.get('/:id/:token',resetPassword )
router.post('/:id/:token',changePassword )
router.get('/verify',verifyUser,verify)

export default router