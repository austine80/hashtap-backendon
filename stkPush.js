import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const authUrl = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
const stkUrl = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

export const getAccessToken = async () => {
    const key = process.env.DARAJA_CONSUMER_KEY;
    const secret = process.env.DARAJA_CONSUMER_SECRET;

    const auth = Buffer.from(`${key}:${secret}`).toString("base64");

    const response = await axios.get(authUrl, {
        headers: {
            Authorization: `Basic ${auth}`
        }
    });

    return response.data.access_token;
};

export const stkPush = async (phone, amount) => {
    const token = await getAccessToken();

    const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, "")
        .slice(0, 14);

    const password = Buffer.from(
        process.env.DARAJA_SHORTCODE + process.env.DARAJA_PASSKEY + timestamp
    ).toString("base64");

    const requestData = {
        BusinessShortCode: process.env.DARAJA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.DARAJA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.CALLBACK_URL,
        AccountReference: "Payment",
        TransactionDesc: "Test Payment"
    };

    const response = await axios.post(stkUrl, requestData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response.data;
};
