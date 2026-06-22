import { Router } from "express";
import { db, analyticsEvents } from "../db/schema.ts";
import { v4 as uuidv4 } from "uuid";
import logger from "../src/lib/logger.ts";

const router = Router();

/**
 * Capture custom, real client events for business reporting
 */
router.post("/event", async (req, res) => {
  try {
    const { event_name, path, referrer, session_id, user_id, device_type, browser, os } = req.body;

    if (!event_name || !session_id) {
      return res.status(400).json({ error: "Missing event_name or session_id" });
    }

    const userAgent = req.headers["user-agent"] || "";
    let detectedOS = os || "Unknown OS";
    let detectedBrowser = browser || "Unknown Browser";
    let detectedDevice = device_type || "Desktop";

    if (!os || !browser || !device_type) {
      const ua = userAgent.toLowerCase();
      
      // Basic OS resolution
      if (ua.includes("windows")) detectedOS = "Windows";
      else if (ua.includes("macintosh") || ua.includes("mac os")) detectedOS = "macOS";
      else if (ua.includes("android")) detectedOS = "Android";
      else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) detectedOS = "iOS";
      else if (ua.includes("linux")) detectedOS = "Linux";

      // Basic browser resolution
      if (ua.includes("firefox")) detectedBrowser = "Firefox";
      else if (ua.includes("chrome") || ua.includes("chromium")) detectedBrowser = "Chrome";
      else if (ua.includes("safari") && !ua.includes("chrome")) detectedBrowser = "Safari";
      else if (ua.includes("edge")) detectedBrowser = "Edge";

      // Device resolution
      if (/mobile|android|iphone|ipad|phone/.test(ua)) {
        detectedDevice = "Mobile";
        if (/ipad/.test(ua)) detectedDevice = "Tablet";
      } else {
        detectedDevice = "Desktop";
      }
    }

    await db.insert(analyticsEvents).values({
      id: uuidv4(),
      user_id: user_id || null,
      session_id,
      event_name,
      path: path || null,
      referrer: referrer || null,
      device_type: detectedDevice,
      browser: detectedBrowser,
      os: detectedOS,
    });

    res.json({ success: true });
  } catch (err: any) {
    logger.error("Failed to insert first-party analytics event:", { error: err?.message || err });
    res.status(500).json({ error: "Failed to record event" });
  }
});

export default router;
