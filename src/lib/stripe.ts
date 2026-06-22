import Stripe from "stripe";
import { getAppConfig } from "./app-config.ts";

let stripeClient: Stripe | null = null;

export async function getStripe(): Promise<Stripe> {
  const key = await getAppConfig('STRIPE_SECRET_KEY');

  if (!key) {
    throw new Error('Stripe Secret Key not configured. Please set it in the environment.');
  }

  // Re-initialize if key changed or not yet initialized
  if (!stripeClient || (stripeClient as any)._key !== key) {
    stripeClient = new Stripe(key, { apiVersion: "2024-06-20" as any });
    (stripeClient as any)._key = key; // Store key to detect changes
  }
  
  return stripeClient;
}
