import dotenv from "dotenv";

dotenv.config();

if (!process.env.PORT) {
  console.log("✅ Environment variables loaded");
}
