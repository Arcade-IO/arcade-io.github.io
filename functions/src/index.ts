import { onRequest, Request } from "firebase-functions/v2/https";
import { v2 as cloudinary } from "cloudinary";

const cors = require("cors")({ origin: true });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const getCloudinarySignature = onRequest(
  { region: "europe-west1" },
  async (req: Request, res: any): Promise<void> => {
    cors(req, res, async () => {
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
          (cloudinary.config() as any).api_secret
        );

        res.status(200).json({
          public_id,
          timestamp,
          signature,
          api_key: (cloudinary.config() as any).api_key,
          cloud_name: (cloudinary.config() as any).cloud_name
        });
      } catch (err: any) {
        console.error("Signature error:", err?.message || err);
        res.status(500).json({ error: err?.message || "Unknown error" });
      }
    });
  }
);
