import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import { razorpay } from "../server.js";
import crypto from "crypto";

// ✅ Get Razorpay API key
export const getRazorPayApiKey = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Razorpay API key",
    key: process.env.RAZORPAY_KEY_ID,
  });
};

// ✅ Buy Subscription
// export const buySubscription = async (req, res, next) => {
//   try {
//     const { id } = req.user;
//     const user = await User.findById(id);

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized, please login",
//       });
//     }

//     if (user.role === "ADMIN") {
//       return res.status(403).json({
//         success: false,
//         message: "ADMIN can't buy subscription",
//       });
//     }

//     const subscription = await razorpay.subscriptions.create({
//       plan_id: process.env.RAZORPAY_PLAN_ID,
//       customer_notify: 1,
//     });

//     // ✅ Fixed typo: 'subcription' ➜ 'subscription'
//     user.subscription.id = subscription.id;
//     user.subscription.status = subscription.status;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Subscribed successfully",
//       subscription_id: subscription.id,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
export const buySubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, please login",
      });
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "ADMIN can't buy subscription",
      });
    }

    // 👉 Log to confirm environment variable is available
    console.log("RAZORPAY_PLAN_ID:", process.env.RAZORPAY_PLAN_ID);

    if (!process.env.RAZORPAY_PLAN_ID) {
      return res.status(500).json({
        success: false,
        message: "Razorpay Plan ID is not defined in environment variables",
      });
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
    });

    console.log("Subscription created:", subscription.id, subscription.status);
    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Subscribed successfully",
      subscription_id: subscription.id,
    });
  } catch (err) {
    console.error("Buy Subscription Error:", err); // ✅ Add this
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ✅ Verify Subscription
export const verifySubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, please login",
      });
    }

    const subscriptionId = user.subscription.id;

    // ✅ Signature generation (order may vary depending on Razorpay config)
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_subscription_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment not verified, please try again",
      });
    }

    await Payment.create({
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    });

    user.subscription.status = "active";
    await user.save();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ✅ Cancel Subscription
export const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, please login",
      });
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "ADMIN can't cancel subscription",
      });
    }

    // ✅ Fixed typo: 'subcription' ➜ 'subscription'
    const subscriptionId = user.subscription.id;

    const subscription = await razorpay.subscriptions.cancel(subscriptionId);
    user.subscription.status = subscription.status;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ✅ Get All Payments
export const allPayments = async (req, res, next) => {
  try {
    const { count } = req.query;

    const subscriptions = await razorpay.subscriptions.all({
      count: count || 10,
    });

    res.status(200).json({
      success: true,
      message: "All payments",
      subscriptions,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
