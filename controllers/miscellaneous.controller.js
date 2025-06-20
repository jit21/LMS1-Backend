// import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';

// import User from '../models/user.model.js';
import User from '../models/user.model.js';
import sendEmail from '../utils/sendEmail.js';

/**
 * @CONTACT_US
 * @ROUTE @POST {{URL}}/api/v1/contact
 * @ACCESS Public
 */
export const contactUs = asyncHandler(async (req, res, next) => {
  // Destructuring the required data from req.body
  const { name, email, message } = req.body;

  // Checking if values are valid
  if (!name || !email || !message) {
    return res.status(400).json({
        success: false,
        message: 'Please provide all the required fields: name, email, and message.',
    });
  }

  try {
    const subject = 'Contact Us Form';
    const textMessage = `Name- ${name} - Email Id- ${email} <br /> Text Message - ${message}`;

    // Await the send email
    await sendEmail("jitkumardas2002@gmail.com", subject, textMessage);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
        success: false,
      message: 'Failed to send your request. Please try again later.',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Your request has been submitted successfully',
  });
});

/**
 * @USER_STATS_ADMIN
 * @ROUTE @GET {{URL}}/api/v1/admin/stats/users
 * @ACCESS Private(ADMIN ONLY)
 */
export const userStats = asyncHandler(async (req, res, next) => {
  const allUsersCount = await User.countDocuments();

  const subscribedUsersCount = await User.countDocuments({
    'subscription.status': 'active', // subscription.status means we are going inside an object and we have to put this in quotes
  });
  

  res.status(200).json({
    success: true,
    message: 'All registered users count',
    allUsersCount,
    subscribedUsersCount,
  });
});
