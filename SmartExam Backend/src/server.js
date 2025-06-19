import connectDB from "./db/index.js";
import dotenv from "dotenv";
import {app} from "./app.js"

dotenv.config({
    path: "./env"
});

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("Error in app: ", error);
        throw error;
    });

    app.listen(process.env.PORT || 3000, () => {
        console.log("Server is listening on ", process.env.PORT);
    });
})
.catch((error) => {
    console.log("MongoDB connection failed: ", error);
});