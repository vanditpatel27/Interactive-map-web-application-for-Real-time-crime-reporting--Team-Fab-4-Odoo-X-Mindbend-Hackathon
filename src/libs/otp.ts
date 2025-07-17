
import nodemailer from 'nodemailer';

export async function sendOTP(otp: string, recipientEmail: string) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", // e.g., smtp.gmail.com
        port:  587,
        secure: false, // true for port 465, false for other ports
        auth: {
            user: "ankit2022svnit@gmail.com", // your email address
            pass: "ywjrzkwsgnunsbkd", // your email password or app-specific password
        },
    });

    const mailOptions = {
        from: `"Nigrani" <${"ankit2022svnit@gmail.com"}>`,
        to: recipientEmail,
        subject: 'Your Nigrani OTP Code',
        text: `Your Nigrani verification code is ${otp}. Please do not share your OTP or PIN with others.`,
    };

    return transporter.sendMail(mailOptions);
}

export function isPhoneNo(phoneNumber: string) {
    // Remove any whitespace, hyphens, or '+' from the input
    const cleanNumber = phoneNumber.replace(/[\s\-\+]/g, '');

    // Three possible formats:
    // 1. Starting with '01' (local format): 11 digits total
    // 2. Starting with '880' (international format without '+'): 13 digits total
    // 3. Starting with '+880' (international format with '+'): 13 digits total
    const bdPhoneRegex = /^(?:(?:\+?880)|0)1[3-9]\d{8}$/;

    return bdPhoneRegex.test(cleanNumber);
}

export const parsePhoneNumber = (phoneNumber: string) => {
    const numStr = phoneNumber.toString();
    if (numStr.startsWith('88')) return numStr;
    if (numStr.startsWith('01')) return `88${numStr}`;
    return `88${numStr}`;
}