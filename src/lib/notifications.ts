import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import logger from "./logger.ts";

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function initNotifications(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    logger.info("Admin WebSocket client connected");
    clients.add(ws);

    ws.on("close", () => {
      logger.info("Admin WebSocket client disconnected");
      clients.delete(ws);
    });

    ws.on("error", (err) => {
      logger.error("WebSocket client error", { error: err.message });
      clients.delete(ws);
    });
  });

  logger.info("Notification WebSocket server initialized at /ws");
}

export interface NotificationPayload {
  id: string;
  type: "signup" | "purchase" | "system";
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

export function broadcastNotification(
  type: "signup" | "purchase" | "system",
  title: string,
  message: string,
  data?: any
) {
  if (!wss) {
    logger.warn("WebSocket server not initialized; skipping broadcast", { type, title });
    return;
  }

  const notification: NotificationPayload = {
    id: Math.random().toString(36).substring(2, 11),
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    data,
  };

  const payloadStr = JSON.stringify(notification);
  logger.info("Broadcasting real-time admin notification", { type, title, message });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payloadStr);
      } catch (err: any) {
        logger.error("Failed to send WebSocket message to client", { error: err.message });
      }
    }
  });

  // Support external Slack/Discord webhook notifications if configured
  const webhookUrl = process.env.ADMIN_NOTIFICATION_WEBHOOK_URL;
  if (webhookUrl) {
    globalThis.fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🚨 *[CareerCraft Administrative Alert]*: *${title}*\n${message}\nTimestamp: ${new Date().toLocaleString()}\nDetails:\n\`\`\`json\n${JSON.stringify(data || {}, null, 2).substring(0, 1000)}\n\`\`\``
      })
    }).catch((err: any) => logger.error("Failed to transmit external webhook", { error: err.message }));
  } else {
    logger.info(`[Admin Slack Webhook Simulator] Alert [${title}]: ${message}`);
  }
}
