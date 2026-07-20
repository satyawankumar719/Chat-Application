import mongoose from "mongoose";
import { ENV } from './envConfig.js'

export const connectDB = async () => {
    try{
        await mongoose.connect(`${ENV.MONGO_URI}/${ENV.DB_NAME}`);
        console.log("Connection successfull!");
        
    } catch(err) {
        console.log('Error connecting mongodb: ', err.message);
        process.exit(1);
    }
}