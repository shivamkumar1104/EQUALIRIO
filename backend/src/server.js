import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
}
dotenv.config(); // fallback to default CWD

const PORT = process.env.PORT || 5000;
const REQUIRED_ENV_VARS = ["MONGODB_URL", "JWT_SECRET"];

const startServer = async () => {
    try {
        const missingEnvVars = REQUIRED_ENV_VARS.filter((name) => !process.env[name]?.trim());
        if (missingEnvVars.length > 0) {
            throw new Error(`Missing required Render environment variables: ${missingEnvVars.join(", ")}`);
        }

        const [{ default: app }, { default: connectDB }] = await Promise.all([
            import("./app.js"),
            import("./config/db.js"),
        ]);
        await connectDB();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("server startup failed:", error.message);
        process.exit(1);
    }
};


startServer();