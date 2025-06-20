import mongoose from "mongoose";
mongoose.set('strictQuery',false);

const connectionToDB= async()=>{
    try{
   const {connection}= await mongoose.connect(
    process.env.MONGODB_URI)
    if(connection){
        console.log(`Connecgted to MongoDB : ${connection.host}`);
        
    }
}
    catch(e){
        console.log(e);
        process.exit(1);
    }
}
export default connectionToDB;