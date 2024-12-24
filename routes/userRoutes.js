import express from 'express';
import { signUpUser, signInUser, logoutUser, followUnFollowUser, updateUser, userProfile } from '../controllers/userController.js';
import protectRoute from '../middlewares/protectRoute.js';

const router = express.Router();

router.get('/profile/:query', userProfile);

router.post('/signup', signUpUser);
router.post('/login', signInUser);
router.post('/logout', logoutUser);
router.post('/follow/:id', protectRoute, followUnFollowUser);
router.put('/update/:id', protectRoute, updateUser)

export default router;