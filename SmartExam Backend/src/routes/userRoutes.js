import { Router } from "express"
import { 
    registerUser, loginUser, logoutUser, refreshAccessToken, getThemePreference, updateThemePreference
} from "../controllers/userController.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    registerUser
)

router.route("/login")
.post(loginUser)

router.route("/logout")
.post(
    verifyJWT,
    logoutUser
)

router.route("/refresh-token")
.post(refreshAccessToken)

router.route('/theme')
.get( 
    verifyJWT, 
    getThemePreference
);
router.route('/theme')
.put( 
    verifyJWT, 
    updateThemePreference
);

export default router