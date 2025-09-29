// backend/index.js
import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

dotenv.config();
const app = express();

// ✅ Firebase Admin init
const serviceAccountPath = path.resolve("./src/serviceAccount.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// ✅ Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ✅ Checkout endpoint
app.post("/checkout", async (req, res) => {
  const { amount, currency, userId } = req.body;

  try {
    const apiRes = await axios.post(
      "https://pay.chargily.net/test/api/v2/checkouts",
      {
        amount,
        currency,
        success_url: "http://localhost:5173/payment-success",
        failure_url: "http://localhost:5173/payment-failed",
        metadata: { userId },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CHARJILI_SECRET_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    res.json(apiRes.data);
  } catch (err) {
    console.error("Checkout error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// ✅ Webhook endpoint (must use express.raw!)
app.post("/checkout", async (req, res) => {
  const { amount, currency, userId, success_url, failure_url } = req.body;

  try {
    const apiRes = await axios.post(
      "https://pay.chargily.net/test/api/v2/checkouts",
      {
        amount,
        currency,
        success_url,
        failure_url,
        metadata: { userId },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CHARJILI_SECRET_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    res.json(apiRes.data);
  } catch (err) {
    console.error("Checkout error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});


// ✅ Healthcheck
app.get("/", (req, res) => res.send("Chargily backend running ✅"));

app.listen(process.env.PORT || 3000, () =>
  console.log("✅ Server running on http://localhost:3000")
);
