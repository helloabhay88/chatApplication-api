import express from 'express'
import verifyUser from '../middleware/verifyUser.js'
import users from '../controllers/userController.js'

const router=express.Router()

router.get('/',verifyUser,users)

export default router