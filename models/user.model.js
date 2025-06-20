import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs"
import jwt  from "jsonwebtoken";
import crypto from "crypto";

const userSchma= new Schema({
   fullName: {
    type: 'String',
    required:[true,'Name is required'],
    minLength:[5,'Name must be atleast 5 characters'],
    maxLength:[50,'Name could be less than 50 charcter'],
    lowercase:true,
    trim:true
   },
   email:{
    type: 'String',
    required:[true,'Email is required'],
    lowercase:true,
    trim:true,
    unique:true,
  
   },
   password:{
    type: 'String',
    required:[true,'Password is required'],
    minLength:[8,"Password must be atleast 8 characters"],
    select:false,

   },
   avatar:{
    public_id:{
        type:'String'
    },
    secure_url:{
        type:'String'
    }

   },
   role:{
    type:'String',
    enum:['USER','ADMIN'],
    default:'USER'
   },
   forgotPasswordToken: String,
   forgotPasswordExpiry:Date,
   subscription:{
    id:String,
    status:String
   }

},{
    timestamps:true
});
userSchma.pre('save',async function(next){
if(!this.isModified('password')){
    next();
}
this.password= await bcrypt.hash(this.password,10);
})
userSchma.methods={
    generateJWTToken: async function(){
        return await jwt.sign({
            id: this._id, email: this.email, subsription: this.subsription, role: this.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRY
        }

    )
    },
    comparePassword: async function(plainTextPassword){
     return await bcrypt.compare(plainTextPassword,this.password)
    },
    getResetPasswordToken: async function(){
        const resetToken=crypto.randomBytes(20).toString('hex');
        this.forgotPasswordToken=crypto.createHash('sha256').update(resetToken).digest('hex');
        this.forgotPasswordExpiry=Date.now()+15*60*1000;//15 minit from now
        return resetToken;
    }
}

const User= model("User",userSchma);

export default User;