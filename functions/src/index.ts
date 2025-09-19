import * as dotenv from "dotenv";
dotenv.config();

import { onRequest } from "firebase-functions/v2/https";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const getCloudinarySignature = onRequest(
  { region: "europe-west1" },
  async (req, res) => {
    // Dynamisk CORS baseret på requestens origin
    const allowedOrigins = [
      "http://localhost:4200",
      "https://arcade-io.github.io"
    ];
    const origin = req.get("origin");
    if (origin && allowedOrigins.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
    }

    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Only POST allowed" });
      return;
    }

    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const uid = body?.public_id;

      if (!uid || typeof uid !== "string") {
        res.status(400).json({ error: "public_id (uid) is required" });
        return;
      }

      const public_id = `imageuploader/${uid}`;
      const timestamp = Math.floor(Date.now() / 1000);

      const paramsToSign = {
        public_id,
        timestamp,
        overwrite: true,
        invalidate: true
      };

      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET as string
      );

      res.status(200).json({
        public_id,
        timestamp,
        signature,
        api_key: process.env.CLOUDINARY_API_KEY,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME
      });
    } catch (err: any) {
      console.error("Signature error:", err?.message || err);
      res.status(500).json({ error: err?.message || "Unknown error" });
    }
  }
);
