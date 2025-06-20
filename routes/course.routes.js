import { Router } from "express";
import { createCourse, getAllCourses, getLectureByCourseId, updateCourse, removeCourse,addLecturesToCourseById,updateLectureById,deleteLectureById,getSpecificLecture } from "../controllers/course.controller.js";
import { isLoggedIn, authorizedRoles, authorizedSubscriber } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
const router = new Router();

router.route('/').get(getAllCourses).post(isLoggedIn, authorizedRoles('ADMIN'), upload.single('thumbnail'), createCourse);
router.get(
    "/:courseId/lecture/:lectureId",
    isLoggedIn,
    getSpecificLecture
  );
  

// router.route('/:id').get(isLoggedIn,getLectureByCourseId);
router.route('/:id').get(isLoggedIn,authorizedSubscriber ,getLectureByCourseId).put(isLoggedIn, authorizedRoles('ADMIN'), upload.single('thumbnail'), updateCourse).delete(isLoggedIn, removeCourse).post(isLoggedIn, authorizedRoles('ADMIN'),upload.single('lecture'),addLecturesToCourseById);
router.put(
    "/:courseId/lecture/:lectureId",
    isLoggedIn,
    authorizedRoles("ADMIN"),
    upload.single("lecture"), // expect `lecture` file (video)
    updateLectureById
  );
  
 router.delete(
    "/:courseId/lecture/:lectureId",
    isLoggedIn,
    authorizedRoles("ADMIN"),
    deleteLectureById
  );
  

export default router;