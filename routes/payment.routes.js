
import { Router } from "express";
const router=new Router();
import { getRazorPayApiKey,buySubscription,verifySubscription,cancelSubscription,allPayments } from "../controllers/payment.controller.js";
import { authorizedRoles, isLoggedIn } from "../middleware/auth.middleware.js";

router.route('/razorpay-key').get(isLoggedIn,getRazorPayApiKey);

router.route('/subscribe').post(isLoggedIn,buySubscription);
router.route('/verify').post(isLoggedIn,verifySubscription);
router.route('/unsubscribe').post(isLoggedIn,cancelSubscription);
router.route('/').get(isLoggedIn,authorizedRoles('ADMIN'),allPayments);
export default router;
