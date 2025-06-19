import { apiErrors } from "../utils/apiErrors.js";
import jwt from "jsonwebtoken";
export const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return next(new apiErrors(401, "Unauthorized Request!"));
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decodedToken;

        next();
    } catch (error) {
        const message = error.name === "TokenExpiredError" ? "Access token expired. Please refresh your token." : "Invalid Access Token";
        return next(new apiErrors(401, message));
    }
};

export const isTeacher = (req, res, next) => {
    if (req.user && req.user.role === 'teacher') {
        return next();
    }
    return next(new apiErrors(403, "Forbidden - Teachers only"));
};

export const isStudent = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        return next();
    }
    return next(new apiErrors(403, "Forbidden - Students only"));
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new apiErrors(403, `Forbidden - You do not have permission to access this resource. Required role(s): ${roles.join(', ')}`));
        }
        next();
    };
};