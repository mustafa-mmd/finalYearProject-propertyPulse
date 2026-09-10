import Stripe from "stripe";

const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key_for_build";

const stripe = new Stripe(apiKey, {
  apiVersion: "2024-11-20.acacia",
  typescript: false,
});

export default stripe;
