import {model, Schema} from 'mongoose';

const CourseSchema = new Schema({
    title:{
        type:String,
        required:[true,'Title is required'],
        minLength:[8,'Title should be at least 8 characters'],
        maxLength:[100,'Title should not exceed 100 characters'],
        trim:true,
        
    },
    description:{
        type:String,
        required:[true,'Description is required'],
        minLength:[20,'Description should be at least 20 characters'],
        maxLength:[2000,'Description should not exceed 2000 characters'],
    },
    category:{
        type:String,
        required:[true,'Category is required'],
        
    },
    thumbnail:{
        public_id:{
            type:String,
            
        },
        secure_url:{
            type:String,
        }
    },
    lectures:[
        {
            title:String,
            description:String,
            lecture:[{
                public_id:{
                    type:String,
                    required:true,
                    
                },
                secure_url:{
                    type:String,
                    required:true,
                }

            }]
        }
    ],
    createdBy:{
        type:String,
        required:true,
    },
    numberOfLectures:{
        type:Number,
        default:0,
    },
    createdAt:{
        type:String,

    
    }},
    { timestamps: true })

const Course = model('Course', CourseSchema);
export default Course;