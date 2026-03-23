const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined");
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB_NAME || undefined,
  });

  return connection.connection;
};

module.exports = connectDB;
