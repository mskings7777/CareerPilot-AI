import mongoose from 'mongoose';
import config from './index';

let connectionPromise: Promise<typeof mongoose> | null = null;

const connectDB = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(config.mongodbUri)
      .then((conn) => {
        console.log(`MongoDB connected: ${conn.connection.host}`);
        return conn;
      })
      .catch((error) => {
        connectionPromise = null;
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  return connectionPromise;
};

export default connectDB;
