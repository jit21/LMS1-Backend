import { Router } from "express";
import { register,login,logout,getProfile,forgotpassword,resetpassword,changePassword,updateUser } from "../controllers/user.controllers.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
const router=Router();
router.post('/register',upload.single("avatar"),register);
router.post('/login',login);
router.get('/logout',logout);
router.get('/me',isLoggedIn,getProfile);
router.post('/reset',forgotpassword);
router.post('/reset-password/:resetToken',resetpassword);
router.post('/change-password',isLoggedIn,changePassword);
router.put('/update',isLoggedIn,upload.single("avatar"),updateUser);

export default router;