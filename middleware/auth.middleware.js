import AppError from "../utils/error.util.js";
import jwt from "jsonwebtoken"

const isLoggedIn = async (req, res, next) => {
    // const { token } = req.cookies;
    // console.log("request in cookies",req.cookies);
    // console.log("token in is logged in",token);

    // if (!token) {
    //     return res.status(401).json({
    //         success: false,
    //         message: "Login first to access this resource",
    //     });
    // }

    // try {
    //     const userDetails = jwt.verify(token, process.env.JWT_SECRET);
    //     req.user = userDetails; // ✅ Attach user info to request
    //     console.log(" No Error in isLoggedin");

    //     next();
    // } catch (err) {
    //     return res.status(401).json({
    //         success: false,
    //         message: "Invalid or expired token",
    //     });
    // }
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authorization header missing or invalid",
        });
    }

    const token = authHeader.split(" ")[1];
    console.log("logged in token",token);

    try {
        const userDetails = jwt.verify(token, process.env.JWT_SECRET);
        req.user = userDetails;
        console.log("Authenticated user:", userDetails);
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
const authorizedRoles=(...roles)=>async(req,res,next)=>{
    
    const currUserRole= req.user.role;
    if(!roles.includes(currUserRole)){
        return res.status(403).json({
            success:false,
            message:`Role ${currUserRole} is not allowed to access this resource`,
        });
    }
    console.log(" No Error in authorizedRoles");
    next();
    
}
const authorizedSubscriber= async(req,res,next)=>{
    const subscription= req.user.subscription;
    const currUserRole= req.user.role;
    if(currUserRole !='ADMIN' && subscription.status !='active'){
        return res.status(403).json({
            success: false,
            message: "Please subscribe to access the route"
        })
    }
    next();

}

export{
    isLoggedIn,
    authorizedRoles,
    authorizedSubscriber
}
