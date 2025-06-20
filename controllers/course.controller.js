import Course from "../models/course.model.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";

const getAllCourses=async function(req, res,next){
 try{const courses=await Course.find({}).select('-lectures');
 res.status(200).json({
   success:true,
   message:'All courses fetched successfully',
    courses,
})}
    catch (error) {
        res.status(500).json({
            success:false,
            message:'Internal server error',
            error:error.message,
        })
    }

}

const getLectureByCourseId=async function(req, res,next){
 try{
      console.log("get lecture by course id");
      const { id } = req.params;
      const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
            success: false,
            message: 'Course not found',
            });
        }
       return  res.status(200).json({
            success: true,
            message: 'Course lectures fetched successfully',
            lectures: course.lectures,
        })

 }catch(error){
    res.status(500).json({
        success:false,
        message:'Internal server error',
        error:error.message,
    })

}
}

const createCourse=async (req,res)=>{
    try{
      console.log("create course error is here");
    const {title,description, category,createdBy}= req.body;

    if(!title || !description || !category || !createdBy) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required',
        });
    }
    console.log("Error is here -1");
    console.log("req.file->", title,description,category,createdBy, req.file);
    const course= await Course.create({
        title,
        description,
        category,
        createdBy,
        thumbnail:{
            public_id:"sample",
            secure_url:"sample"
        },
        
    });
    console.log("Error is here -2", course);

    if(!course) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
    if(req.file) {
        const result= await cloudinary.v2.uploader.upload(req.file.path,{
            folder: 'lms'
        });
        if(result){
            course.thumbnail.public_id=result.public_id;
            course.thumbnail.secure_url=result.secure_url;
        }
        fs.rm(`uploads/${req.file.filename}`)
        
    }
    await course.save();
    res.status(201).json({
        success: true,
        message: 'Course created successfully',
        course});
    }catch(error){
    res.status(500).json({
    success:false,
    message:'Internal server error',
    error:error.message,
    })
    
    
    }
        



}
const updateCourse= async (req,res)=>{

    try{
        const {id}= req.params;
        const course= await Course.findById(id);
        if(!course){
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }
        const {title,description,category}= req.body;
        console.log("update data : ",title,description,category);
        if(title){
            course.title=title;
        }
        if(description){
            course.description=description;
        }
        if(category){
            course.category=category;
        }
        if(req.file){
            await cloudinary.v2.uploader.destroy(course.thumbnail.public_id);
            const result= await cloudinary.v2.uploader.upload(req.file.path,{
                folder:'lms'
            });
            if(result){
                course.thumbnail.public_id=result.public_id;
                course.thumbnail.secure_url=result.secure_url;
            }
           await  fs.rm(`uploads/${req.file.filename}`)
            
        }
        console.log(JSON.stringify(course));
        await course.save();
        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            course
        })
    }catch(error){
        res.status(500).json({
            success:false,
            message:'Internal server error',
            error:error.message,
        })
    }

}

const removeCourse= async (req,res)=>{
    try{
        const id= req.params.id;
        const course= await Course.findById(id);
        if(!course){
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }
        await Course.findByIdAndDelete(id);
       
        res.status(200).json({
            success: true,
            message: 'Course deleted successfully',
        })

    }catch(error){
        res.status(500).json({
            success:false,
            message:'Internal server error',
            error:error.message,
        })
    }


}
const addLecturesToCourseById= async(req,res)=>{
    try{const{title,description} =req.body;
    const {id}= req.params;
    if(!title || !description){
        return res.status(400).json({
            success: false,
            message: 'All fields are required',
        });
    }
    const course= await Course.findById(id);
    if(!course){
        return res.status(404).json({
            success: false,
            message: 'Course not found',
        });
    }
    const lectureData={
        title,
        description,
        lecture:{},
    }
    if(req.file){
        const result= await cloudinary.v2.uploader.upload(req.file.path,{
            folder:'lms',
            resource_type: 'video'
        });
        if(result){
            lectureData.lecture.public_id=result.public_id;
            lectureData.lecture.secure_url=result.secure_url;
        }
        fs.rm(`uploads/${req.file.filename}`)
        
    }
    course.lectures.push(lectureData);
    course.numberOfLectures=course.lectures.length;
    await course.save();
    res.status(201).json({
        success: true,
        message: 'Lecture added successfully',
        course
    });

}catch(error){
    res.status(500).json({
        success:false,
        message:'Internal server error',
        error:error.message,
    })
}


}
const deleteLectureById = async (req, res) => {
    try {
      console.log("delete lecture by id");
      const { courseId, lectureId } = req.params;
      console.log("courseId->", courseId);
      console.log("lectureId->", lectureId);
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }
  
      const lecture = course.lectures.id(lectureId);
      if (!lecture) {
        return res.status(404).json({ success: false, message: "Lecture not found" });
      }
  
      // Delete lecture video from Cloudinary
      if (lecture.lecture?.public_id) {
        await cloudinary.v2.uploader.destroy(lecture.lecture.public_id, {
          resource_type: "video"
        });
      }
  
      // Remove lecture from course
      course.lectures.pull({ _id: lectureId });
  
      course.numberOfLectures = course.lectures.length;
  
      await course.save();
  
      res.status(200).json({
        success: true,
        message: "Lecture deleted successfully",
        course
      });
  
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
const updateLectureById = async (req, res) => {
    try {
      const { courseId, lectureId } = req.params;
      const { title, description } = req.body;
  
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }
  
      const lecture = course.lectures.id(lectureId);
      if (!lecture) {
        return res.status(404).json({ success: false, message: "Lecture not found" });
      }
  
      // Update fields if provided
      if (title) lecture.title = title;
      if (description) lecture.description = description;
  
      // If new file is uploaded, replace the old video
      if (req.file) {
        // Delete old video from Cloudinary
        await cloudinary.v2.uploader.destroy(lecture.lecture.public_id, {
          resource_type: "video"
        });
  
        // Upload new one
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
          resource_type: "video"
        });
  
        lecture.lecture.public_id = result.public_id;
        lecture.lecture.secure_url = result.secure_url;
  
        fs.rm(`uploads/${req.file.filename}`, () => {});
      }
  
      await course.save();
  
      res.status(200).json({
        success: true,
        message: "Lecture updated successfully",
        lecture
      });
  
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
const getSpecificLecture = async (req, res) => {
    try {
      const { courseId, lectureId } = req.params;
  
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }
  
      const lecture = course.lectures.id(lectureId);
      if (!lecture) {
        return res.status(404).json({
          success: false,
          message: "Lecture not found",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Lecture fetched successfully",
        lecture,
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
  
  
export { getAllCourses, getLectureByCourseId,createCourse,updateCourse,removeCourse,addLecturesToCourseById,deleteLectureById,updateLectureById,getSpecificLecture };