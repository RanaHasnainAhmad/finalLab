import { User } from "../models/User.js";
import { asyncDbHandler } from "../utils/asyncDbHandler.js"; 
import { apiResponse } from "../utils/apiResponse.js";
import { apiErrors } from "../utils/apiErrors.js";
import cookie from "cookie-parser"
import crypto from 'crypto';
 import jwt from "jsonwebtoken"
 import mongoose from "mongoose";
 
 
const generateAccessAndRefreshTokens = async (userId, res) => {
     try {
         const user = await User.findById(userId);
         if (!user) {
             throw new apiErrors(404, "User not found");
         }
 
         const accessToken = await user.generateAccessToken();
         const refreshToken = await user.generateRefreshToken();
 
         res.cookie("refreshToken", refreshToken, {
             httpOnly: true,
             secure: process.env.NODE_ENV === "production",
             sameSite: "None",
             maxAge: 7 * 24 * 60 * 60 * 1000
         });
 
         return { accessToken, refreshToken };
     } catch (error) {
         throw new apiErrors(500, "Error generating tokens");
     }
 }; 

const registerUser = asyncDbHandler(async (req, res) => {
    const { email, fullname, password, role } = req.body;

    if (!email || !fullname || !password || !role) {
        throw new apiErrors(400, "All fields are required");
    }

    let user = await User.findOne({ email, role });

    if (user) {
        throw new apiErrors(409, "User with this email already exists");
    }

    user = await User.create({
        role,
        fullname,
        email,
        password,
    });

    try {
        const createdUser = await User.findById(user._id).select("-password -refreshTokens");
        if (!createdUser) {
            throw new Error("Error fetching created user");
        }

        return res.status(201).json(new apiResponse(201, createdUser, "User registered successfully!"));
        
    } catch (error) {
        await User.findByIdAndDelete(user._id);
        console.error("[Registration Error]:", error);
        throw new apiErrors(500, "User registration failed, please try again.");
    }
});
    
const loginUser = asyncDbHandler(async (req, res, next) => {
     const { role, email, password } = req.body;
 
     if (!role || !email || !password) {
         throw new apiErrors(400, "Please fill in all required fields");
     }
 
     const user = await User.findOne({ email }).select("+password +refreshToken");
     if (!user) {
         throw new apiErrors(404, "Account does not exist!");
     }
 
     if (user.role !== role) {
         throw new apiErrors(401, "Your selected role is not correct");
     }
 
     const isPasswordValid = await user.isPasswordCorrect(password);
     if (!isPasswordValid) {
         throw new apiErrors(401, "Invalid email or password");
     }
 
     if (user.refreshToken) {
         return next(new apiErrors(409, "User is already logged in. Please log out from other devices first."));
     }
 
     const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, res);
 
     user.refreshToken = refreshToken;
     await user.save({ validateBeforeSave: false });
 
     const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
 
     const cookieOptions = {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: "None",
         maxAge: 7 * 24 * 60 * 60 * 1000,
     };
 
     return res.status(200)
         .cookie("accessToken", accessToken, cookieOptions)
         .json(
             new apiResponse(
                 200,
                 { user: loggedInUser, accessToken, refreshToken },
                 "User Logged In Successfully!"
             )
         );
});
 
const logoutUser = asyncDbHandler(async (req, res) => {
  const userId = req.user?._id;
  console.log(userId);
  
  const refreshToken = req.cookies?.refreshToken;

  if (!userId || !refreshToken) {
    throw new apiErrors(404, "Missing refresh token!");
  }

  const user = await User.findById(userId).select("+refreshTokens");
  if (user) {
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
    await user.save({ validateBeforeSave: false });
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json(new apiResponse(200, null, "User Logged Out Successfully!"));
});
 
const refreshAccessToken = asyncDbHandler(async (req, res) => {
     const cookieRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
 
     if (!cookieRefreshToken) {
         throw new apiErrors(401, "Unauthorized request");
     }
 
     try {
         const decodedRefreshToken = jwt.verify(cookieRefreshToken, process.env.REFRESH_TOKEN_SECRET);
 
         const user = await User.findById(decodedRefreshToken?._id).select("+refreshToken");
 
         if (!user) {
             throw new apiErrors(401, "Invalid refresh token");
         }
 
         const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
 
         user.refreshToken = newRefreshToken;
         await user.save();
 
         const cookieOptions = {
             httpOnly: true,
             secure: process.env.NODE_ENV === "production",
             sameSite: "None",
             maxAge: 7 * 24 * 60 * 60 * 1000,
         };
 
         return res.status(200)
             .cookie("accessToken", accessToken, cookieOptions)
             .cookie("refreshToken", newRefreshToken, cookieOptions)
             .json(new apiResponse(200, { accessToken }, "Access token refreshed successfully!"));
 
     } catch (error) {
         if (error.name === "TokenExpiredError") {
             throw new apiErrors(403, "Refresh token expired, please login again");
         }
         throw new apiErrors(401, "Invalid refresh token");
     }
});

const getThemePreference = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming you attach user info in verifyJWT middleware
    const user = await User.findById(userId).select('theme');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ theme: user.theme || 'light' });
  } catch (error) {
    console.error('Error in getThemePreference:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateThemePreference = async (req, res) => {
  const { theme } = req.body;
  await User.findByIdAndUpdate(req.user.id, { themePreference: theme });
  res.json({ message: 'Theme updated' });
};
 
 export {
     generateAccessAndRefreshTokens,
     registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken,
     getThemePreference,
     updateThemePreference
 };