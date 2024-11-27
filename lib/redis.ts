// lib/redis.js
import { Redis } from "@upstash/redis";
import { createClient } from "redis";

// for upstash redis
// const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN,
// });

// for local redis

const redis = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

redis.on("error", (err) => console.error("Redis Client Error", err));
redis.connect();

export default redis;
