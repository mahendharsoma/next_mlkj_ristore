import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendOTPEmail(to: string, otp: number): Promise<void> {
  await transporter.sendMail({
    from: `"Stock Management" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your OTP for Stock Management',
    html: `<p>Your OTP is: <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
  })
}
