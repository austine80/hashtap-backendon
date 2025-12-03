import express from "express";
import cors from "cors";
import { stkPush } from "./stkPush.js";

const app = express();
app.use(cors());
app.use(express.json());

// Mock database to store payment results for testing
// In production, replace with real DB (MongoDB, PostgreSQL, etc.)
const payments = {};

// 1️⃣ Initiate STK Push (Frontend calls this)
app.post("/pay", async (req, res) => {
    try {
        const { phone, amount } = req.body;

        const formattedPhone = phone.startsWith("254")
            ? phone
            : phone.replace(/^0/, "254");

        const result = await stkPush(formattedPhone, amount);

        // Store request ID in mock DB
        payments[result.CheckoutRequestID] = { status: "PENDING", amount, phone: formattedPhone };

        res.json(result);
    } catch (error) {
        res.status(500).json({
            message: "Payment request failed",
            error: error.response?.data || error.message,
        });
    }
});

// 2️⃣ Safaricom sends callback here
app.post("/callback", (req, res) => {
    console.log("💚 Payment Callback Received:", req.body);
    res.sendStatus(200); // Must reply 200 to Safaricom

    // Update mock DB with actual result
    const callbackData = req.body.Body.stkCallback;
    if (callbackData && callbackData.CheckoutRequestID) {
        payments[callbackData.CheckoutRequestID] = {
            status: callbackData.ResultCode === 0 ? "SUCCESS" : "FAILED",
            amount: payments[callbackData.CheckoutRequestID]?.amount || 0,
            phone: payments[callbackData.CheckoutRequestID]?.phone || "",
            raw: callbackData
        };
    }
});

// 3️⃣ GET payment status by CheckoutRequestID
app.get("/payment-status/:id", (req, res) => {
    const checkoutId = req.params.id;
    console.log("Received request for payment status:", checkoutId);

    const payment = payments[checkoutId];
    if (payment) {
        res.json({ success: true, data: payment });
    } else {
        res.status(404).json({ success: false, message: "Payment status not found" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
