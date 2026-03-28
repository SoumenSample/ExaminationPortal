/**
 * Calculate registration fee based on age
 * Age 8–12 years: Rs 100
 * Age 13–16 years: Rs 150
 * Age 17–22 years: Rs 200
 */
export function calculateRegistrationFee(age) {
  age = parseInt(age)
  
  if (age >= 8 && age <= 12) {
    return 100
  } else if (age >= 13 && age <= 16) {
    return 150
  } else if (age >= 17 && age <= 22) {
    return 200
  } else {
    throw new Error("Age must be between 8 and 22 years")
  }
}

/**
 * Calculate commission/referral amount based on registration fee
 * Rs 100 →  Rs 5 commission
 * Rs 150 → Rs 10 commission
 * Rs 200 → Rs 15 commission
 */
export function calculateCommission(registrationFee) {
  registrationFee = parseInt(registrationFee)
  
  if (registrationFee === 100) {
    return 5
  } else if (registrationFee === 150) {
    return 10
  } else if (registrationFee === 200) {
    return 15
  } else {
    throw new Error("Invalid registration fee")
  }
}

/**
 * Generate OTP - 6 digit random number
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Generate temporary password
 */
export function generateTemporaryPassword() {
  const length = 12
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
  let password = ""
  
  // Ensure at least one uppercase, one lowercase, one number, one special char
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]
  password += "0123456789"[Math.floor(Math.random() * 10)]
  password += "!@#$%"[Math.floor(Math.random() * 5)]
  
  // Fill remaining characters
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle password
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("")
}
