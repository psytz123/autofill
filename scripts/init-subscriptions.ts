import { pool, db } from "../server/db";
import { subscriptionPlans, SubscriptionPlanType } from "../shared/schema";

async function main() {
  try {
    console.log("Creating subscription plans...");
    
    // Check if plans already exist
    const existingPlans = await db.select().from(subscriptionPlans);
    
    if (existingPlans.length > 0) {
      console.log("Subscription plans already exist. Skipping initialization.");
      return;
    }
    
    // Create basic plan (no subscription, pay per order)
    await db.insert(subscriptionPlans).values({
      name: "Basic",
      type: SubscriptionPlanType.BASIC,
      price: 0, // Free (pay per order)
      deliveryDiscount: 0,
      description: "Pay per order with no monthly fees",
      features: JSON.stringify([
        "Standard delivery fee",
        "Order fuel anytime",
        "Track deliveries in real-time",
        "Multiple vehicle management"
      ]),
      stripePriceId: "price_basic", // This would be replaced with actual Stripe price ID in production
      active: true,
    });
    
    // Create premium plan (discounted delivery)
    await db.insert(subscriptionPlans).values({
      name: "Premium",
      type: SubscriptionPlanType.PREMIUM,
      price: 999, // $9.99 per month
      deliveryDiscount: 15, // 15% discount on delivery fee
      description: "Monthly subscription with discounted delivery",
      features: JSON.stringify([
        "15% off delivery fees",
        "Priority service",
        "Order fuel anytime",
        "Track deliveries in real-time",
        "Multiple vehicle management"
      ]),
      stripePriceId: "price_premium", // This would be replaced with actual Stripe price ID in production
      active: true,
    });
    
    // Create unlimited plan (unlimited deliveries)
    await db.insert(subscriptionPlans).values({
      name: "Unlimited",
      type: SubscriptionPlanType.UNLIMITED,
      price: 1999, // $19.99 per month
      deliveryDiscount: 100, // 100% discount (free delivery)
      description: "Monthly subscription with unlimited deliveries",
      features: JSON.stringify([
        "Free deliveries",
        "VIP priority service",
        "Order fuel anytime",
        "Track deliveries in real-time",
        "Multiple vehicle management",
        "24/7 priority support"
      ]),
      stripePriceId: "price_unlimited", // This would be replaced with actual Stripe price ID in production
      active: true,
    });
    
    console.log("Subscription plans created successfully!");
  } catch (error) {
    console.error("Error creating subscription plans:", error);
  } finally {
    await pool.end();
  }
}

main();