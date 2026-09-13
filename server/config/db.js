import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => {
            console.log(`Database connected to: ${mongoose.connection.host}`);
        });
        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.error("❌ Database connection error", error.message);
    }
};

export default connectDB;