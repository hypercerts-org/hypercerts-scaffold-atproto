import "server-only";
import { createClient } from "redis";

const redisConfig: Parameters<typeof createClient>[0] = {
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
  },
};

if (process.env.REDIS_PASSWORD) {
  redisConfig.username = process.env.REDIS_USERNAME || "default";
  redisConfig.password = process.env.REDIS_PASSWORD;
}

export const redisClient = createClient(redisConfig);

export async function ensureRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

redisClient.on("error", (err) => console.log("Redis Client Error", err));
