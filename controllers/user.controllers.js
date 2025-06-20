import cookieParser from "cookie-parser";
import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import cloudinary from 'cloudinary';
import fs from 'fs';
import sendEmail from "../utils/sendEmail.js";
import crypto from 'crypto';


const cookieOption={
maxAge : 7*24*60*60*1000,
httpOnly : true,
secure: true,
}

const register= async(req,res,next)=>{
const {fullName,email,password}=req.body;
if(!fullName||!email || !password){
    // return next( new AppError('All fields are required',400));
    return res.status(400).json({
        success:false,
        message:'All fields are required'
    })
}
const userExists= await User.findOne({email});
if(userExists){
//  return next(new AppError("Email alredy in use ",400));
return res.status(400).json({
    success:false,
    message:'Email alredy in use'
})
}
const user= await User.create({
    fullName,
    email,
    password,
    avatar:{
        public_id:email,
        secure_url:'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg'
    }
});

if(!user){
    // return next(new AppError("User registration failed, please try again",400));
    return res.status(400).json({
        success:false,
        message:'User registration failed, please try again'
    })
}

// todo :: file upload 
console.log("file ->"+req.file);
if(req.file){
    
    try{
        const result= await cloudinary.v2.uploader.upload(req.file.path,{
            folder:'lms',
            width: 250,
            height: 250,
            gravity:'faces',
            crop:'fill'

        });
        console.log("result ->"+result.secure_url);
        if(result){
            user.avatar.public_id=result.public_id;
            user.avatar.secure_url=result.secure_url;
            //remove file  from server
            // fs.rm(`uploads/${req.file.filename}`)
            fs.unlink(`uploads/${req.file.filename}`, (err) => {
                if (err) {
                    console.error("Failed to delete file:", err);
                } else {
                    console.log("File deleted successfully");
                }
            });
        }
    }
    catch(e){
        return res.status(400).json({
            message:'User registration failed due to image upload, please try again',
        })
    
    }

}
await user.save();
user.password=undefined;
const token= await user.generateJWTToken();

res.cookie('token',token,cookieOption);

res.status(200).json({
    success: true,
    message:'User registerd succesfully',
    user,
    token
})

}

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            // return next(new AppError("All fields are required", 400));
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({
                success: false,
                message: "Wrong credentials"
            });
        }

        const token = await user.generateJWTToken();
        user.password = undefined;

        res.cookie('token', token, cookieOption);

        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            user,
            token
        });
    } catch (e) {
        // return next(new AppError(e.message, 500));
        return res.status(500).json({
            success: false,
            message: e.message
        });
    }
};


const logout=(req,res)=>{

    res.cookie('token', null,{
        secure:true,
        maxAge:0,
        httpOnly:true
    })

    res.status(200).json({
        succes: true,
        message:" User log out succesfully"
    })

}

const getProfile= async (req,res)=>{
try{
  const userId=req.user.id;
  const user= await User.findById(userId);

  res.status(200).json({
    succes:true,
    message:'User details',
    user
  });
    
}catch(e){
    // return next(new AppError('Filed to fatch user profile details',500));
    return res.status(500).json({
        success: false,
        message: 'Filed to fatch user profile details',
    });

}


}
const forgotpassword = async (req, res, next) => {
    const frontendURL = req.headers.origin || req.headers.referer;
    console.log('Frontend URL:', frontendURL);
    const { email } = req.body;

    if (!email) {
        // return next(new AppError('Email is required', 400));
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    const user = await User.findOne({ email });
    if (!user) {
        // return next(new AppError('User not found with this email', 400));
        return res.status(400).json({
            success: false,
            message: 'User not found with this email'
        });

    }

    const resetToken = await user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log("resetPasswordUrl->"+resetPasswordUrl);
    const message = `You can reset your password by clicking <a href="${resetPasswordUrl}">here</a>`;
    const subject = 'Password reset link';

    try {
        await sendEmail(email, subject, message);
        res.status(200).json({
            success: true,
            message: `Password reset link sent to ${email}`
        });
    } catch (e) {
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save({ validateBeforeSave: false });

        // return next(new AppError('Email could not be sent, please try again', 500));
        return res.status(500).json({
            success: false,
            message: 'Email could not be sent, please try again',
            error:e.message
        });
    }
};

const resetpassword= async (req,res)=>{
const {resetToken}=req.params;
const {password}=req.body;
if(!password){
    return res.status(404).json({
        succes: false,
        message:'Please enter password'
    })
}
const forgotPasswordToken=crypto.createHash('sha256').update(resetToken).digest('hex');
const user= await User.findOne({forgotPasswordToken,forgotPasswordExpiry:{$gt:Date.now()}});
if(!user){
    return res.status(400).json({
        succes:false,
        message:'Token is invalid or expaired, please try again'
    })
}
user.password=password;
user.forgotPasswordToken=undefined;
user.forgotPasswordExpiry=undefined;
user.save();

return res.status(200).json({
    succes: true,
    message:"Passaword succesfully updated"
})

}
const changePassword=async (req,res)=>{
  const{oldPassword,newPassword}=req.body;
    if(!oldPassword || !newPassword){
        return res.status(400).json({
            succes: false,
            message:'All fields are required'
        })
    }
    const {id}= req.user;
    const user=await User.findById(id).select('+password');
    if(!user){
        return res.status(400).json({
            succes: false,
            message:'User not found'
        })
    }
    const isPasswordMatched= await user.comparePassword(oldPassword);
    if(!isPasswordMatched){
        return res.status(400).json({
            succes: false,
            message:'Old password is incorrect'
        })
    }
    user.password=newPassword;
    await user.save();
    user.password=undefined;
    return res.status(200).json({
        succes: true,
        message:'Password changed successfully',
        user
    })
}
const updateUser= async (req,res)=>{
 const {fullName}=req.body;
 const {id}=req.user;
 const user= await User.findById(id);
 if(!user){
    return res.status(400).json({
        succes: false,
        message:'User not found'
    })
 }
 if(req.fullName){
    user.fullName=fullName;
 }
 if(req.file){
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    try{
        const result= await cloudinary.v2.uploader.upload(req.file.path,{
            folder:'lms',
            width: 250,
            height: 250,
            gravity:'faces',
            crop:'fill'

        });
        console.log("result ->"+result.secure_url);
        if(result){
            user.avatar.public_id=result.public_id;
            user.avatar.secure_url=result.secure_url;
            //remove file  from server
            // fs.rm(`uploads/${req.file.filename}`)
            fs.unlink(`uploads/${req.file.filename}`, (err) => {
                if (err) {
                    console.error("Failed to delete file:", err);
                } else {
                    console.log("File deleted successfully");
                }
            });
        }
    }
    catch(e){
        return res.status(400).json({
            message:'User registration failed due to image upload, please try again',
        })
    
    }
    
 }
    await user.save();
    return res.status(200).json({
        succes: true,
        message:'User updated successfully',
        user
    })
}
export {
    register,
    login,
    logout,
    getProfile,
    forgotpassword,
    resetpassword,
    changePassword,
    updateUser
}