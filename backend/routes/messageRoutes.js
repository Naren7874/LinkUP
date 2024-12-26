import express from 'express';
import protectRoute from '../middlewares/protectRoute.js'
import { sendMessage ,getMessage,getConversation} from '../controllers/messageController.js'

const router = express.Router();

// Define routes

router.get('/conversation', protectRoute ,getConversation);
router.post('/', protectRoute ,sendMessage);
router.get('/:otheruserId', protectRoute ,getMessage);

export default router;