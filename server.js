import express from "express";
import cors from "cors";
import { stkPush } from "./stkPush.js";

const app = express();
app.use(cors());
app.use(express.json());

// 1️⃣ Initiate STK Push (Frontend calls this)
app.post("/pay", async (req, res) => {
    try {
        const { phone, amount } = req.body;

        const formattedPhone = phone.startsWith("254")
            ? phone
            : phone.replace(/^0/, "254");

        const result = await stkPush(formattedPhone, amount);
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

    // 👉 You can save success results to DB here
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
