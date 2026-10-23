import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
}
dotenv.config(); // fallback to default CWD

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        const [{ default: app }, { default: connectDB }] = await Promise.all([
            import("./app.js"),
            import("./config/db.js"),
        ]);
        await connectDB();

        app.listen(PORT, () => {
            console.log(`server is running on http://localhost:${PORT}`);
        });

    }catch(error){
        console.error("server startup failed:", error.message);
        process.exit(1);
    }
    };


    startServer();