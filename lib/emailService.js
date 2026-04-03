import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
})

export async function sendOTPEmail(email, otp) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Divyanshi Saksharta Mission Foundation - Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h2 style="margin: 0;">Divyanshi Saksharta Mission Foundation</h2>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h3 style="color: #333; margin-top: 0;">Email Verification Required</h3>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Hello,
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Your One-Time Password (OTP) for email verification is:
            </p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.
            </p>
            
            <p style="color: #666; font-size: 12px; line-height: 1.6; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
              If you did not request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            <p style="margin: 0;">© 2026 Divyanshi Saksharta Mission Foundation. All rights reserved.</p>
          </div>
        </div>
      `
    }
    
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Error sending OTP email:", error)
    return { success: false, error: error.message }
  }
}

export async function sendLoginCredentialsEmail(email, password, loginId) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Divyanshi Saksharta Mission Foundation - Your Login Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h2 style="margin: 0;">Divyanshi Saksharta Mission Foundation</h2>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h3 style="color: #333; margin-top: 0;">Welcome to Our Scholarship Portal!</h3>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Dear Student,
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Congratulations! Your registration has been successfully completed. Your account has been created and is ready to use.
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;">
              Here are your login credentials:
            </p>
            
            <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #333; margin: 10px 0;"><strong>Login ID/Email:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${loginId}</code></p>
              <p style="color: #333; margin: 10px 0;"><strong>Password:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${password}</code></p>
            </div>
            
            <p style="color: #e74c3c; font-size: 13px; font-weight: bold; margin-top: 15px;">
              ⚠️ Important: Please keep these credentials safe and confidential. We recommend changing your password on your first login.
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;">
              <strong>Portal Access Link:</strong><br/>
              <a href="${process.env.APP_URL}/login" style="color: #667eea; text-decoration: none;">${process.env.APP_URL}/login</a>
            </p>
            
            <p style="color: #666; font-size: 12px; line-height: 1.6; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd;">
              If you have any questions or need assistance, please contact our support team.
            </p>
          </div>
          
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            <p style="margin: 0;">© 2026 Divyanshi Saksharta Mission Foundation. All rights reserved.</p>
          </div>
        </div>
      `
    }
    
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Error sending credentials email:", error)
    return { success: false, error: error.message }
  }
}

export async function sendReferralNotificationEmail(MemberEmail, studentName, commissionAmount) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: MemberEmail,
      subject: "Divyanshi Saksharta Mission Foundation - New Referral Earned",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h2 style="margin: 0;">Divyanshi Saksharta Mission Foundation</h2>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h3 style="color: #333; margin-top: 0;">🎉 New Referral Earned!</h3>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Great news! A student has registered through your referral code.
            </p>
            
            <div style="background: white; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #333; margin: 10px 0;"><strong>Student Name:</strong> ${studentName}</p>
              <p style="color: #333; margin: 10px 0;"><strong>Commission Earned:</strong> <span style="color: #27ae60; font-size: 18px; font-weight: bold;">₹${commissionAmount}</span></p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Thank you for your continuous support and for promoting our scholarship platform!
            </p>
          </div>
          
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            <p style="margin: 0;">© 2026 Divyanshi Saksharta Mission Foundation. All rights reserved.</p>
          </div>
        </div>
      `
    }
    
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Error sending referral notification email:", error)
    return { success: false, error: error.message }
  }
}
