"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCloudinaryImage = void 0;
const functions = __importStar(require("firebase-functions"));
const cloudinary_1 = require("cloudinary");
// VIGTIGT: Brug CommonJS require til cors for at undgå "no call signatures" i TS
const cors = require("cors")({ origin: true });
// Læs Cloudinary credentials fra env-config (sat via CLI: firebase functions:config:set ...)
cloudinary_1.v2.config({
    cloud_name: functions.config().cloudinary.cloud_name,
    api_key: functions.config().cloudinary.api_key,
    api_secret: functions.config().cloudinary.api_secret
});
// HTTPS endpoint til at slette et Cloudinary-billede.
// Kald det fra Angular med body: { publicId: "..." }
exports.deleteCloudinaryImage = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") {
            res.status(405).json({ error: "Only POST allowed" });
            return;
        }
        try {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
            const publicId = body === null || body === void 0 ? void 0 : body.publicId;
            if (!publicId || typeof publicId !== "string") {
                res.status(400).json({ error: "publicId is required" });
                return;
            }
            const result = await cloudinary_1.v2.uploader.destroy(publicId, {
                resource_type: "image",
                invalidate: true
            });
            res.status(200).json(result);
        }
        catch (err) {
            res.status(500).json({ error: (err === null || err === void 0 ? void 0 : err.message) || "Unknown error" });
        }
    });
});
//# sourceMappingURL=index.js.map