import mongoose from "mongoose";
import { ENV } from './envConfig.js'

export const connectDB = async () => {
    try{
        await mongoose.connect(`${ENV.MONGO_URI}/${ENV.DB_NAME}`);
        console.log("Connection successfull!");
        
    } catch(err : unknown) {
        const Error = err as Error;
        console.log('Error connecting mongodb: ', Error.message);
        process.exit(1);
    }
}