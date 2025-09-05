import * as functions from "firebase-functions";
import {v2 as cloudinary} from "cloudinary";

// VIGTIGT: Brug CommonJS require til cors for at undgå "no call signatures" i TS
const cors = require("cors")({origin: true});

// Læs Cloudinary credentials fra env-config (sat via CLI: firebase functions:config:set ...)
cloudinary.config({
  cloud_name: functions.config().cloudinary.cloud_name,
  api_key: functions.config().cloudinary.api_key,
  api_secret: functions.config().cloudinary.api_secret
});

// HTTPS endpoint til at slette et Cloudinary-billede.
// Kald det fra Angular med body: { publicId: "..." }
export const deleteCloudinaryImage = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({error: "Only POST allowed"});
      return;
    }

    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const publicId = body?.publicId;

      if (!publicId || typeof publicId !== "string") {
        res.status(400).json({error: "publicId is required"});
        return;
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true
      });

      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({error: err?.message || "Unknown error"});
    }
  });
});
