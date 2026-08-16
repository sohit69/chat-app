import mongoose from "mongoose";

const connectToDB = async () => {
 
    await
     mongoose.connect(process.env.MONGO_URI);
    console.log("DB Connected");
 
    console.error("DB Connection Error:", error);
  }

export default connectToDB;