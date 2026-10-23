/**
 * Environment Variable Validation
 * Validates all required env variables at startup — fails fast if anything is missing.
 */

const required = [
  "MONGODB_URL",
  "JWT_SECRET",
];

const optional = {
  PORT: "5000",
  NODE_ENV: "development",
  JWT_EXPIRES_IN: "30d",
  GOOGLE_CLIENT_ID: "",
  CLOUDINARY_CLOUD_NAME: "",
  CLOUDINARY_API_KEY: "",
  CLOUDINARY_API_SECRET: "",
  RESEND_API_KEY: "",
  EMAIL_FROM: "Equalirio Resort <onboarding@resend.dev>",
  BREVO_SENDER_NAME: "Equalirio Resort",
  FRONTEND_URL: "http://localhost:3000",
};

export const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   • ${key}`));
    console.error("\nPlease check your .env file and add the missing variables.");
    process.exit(1);
  }

  // Set defaults for optional vars
  Object.entries(optional).forEach(([key, defaultValue]) => {
    if (!process.env[key] && defaultValue) {
      process.env[key] = defaultValue;
    }
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("✅ Environment variables validated successfully");
  }
};

export const config = {
  port: parseInt(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUrl: process.env.MONGODB_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || "",
    from: process.env.EMAIL_FROM || "Equalirio Resort <onboarding@resend.dev>",
    brevoApiKey: process.env.BREVO_API_KEY || "",
    brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || "",
    brevoSenderName: process.env.BREVO_SENDER_NAME || "Equalirio Resort",
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};

export default config;
