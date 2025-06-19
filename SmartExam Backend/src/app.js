import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { apiErrors } from "./utils/apiErrors.js";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));



app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use("/public", express.static(path.join(__dirname, "../public")));
app.use(cookieParser());


import examRouter from './routes/examRoutes.js';
import examSubmissionRouter from './routes/submissionRoutes.js';
import userRouter from './routes/userRoutes.js';

app.use("/api/v1/exam", examRouter);
app.use("/api/v1/exam", examSubmissionRouter);
app.use("/api/v1/users", userRouter);

app.use((err, req, res, next) => {
    if (!(err instanceof apiErrors)) {
        console.error("Unhandled Error:", err);
    }

    if (err instanceof apiErrors) {
        return res.status(err.statusCode || 500).json({
            success: err.success || false,
            message: err.message || "Something went wrong",
            errors: err.errors || [],
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal Server Errors",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
});

export { app };
