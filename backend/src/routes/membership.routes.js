import express from 'express';
import { subscribe, checkMembership, getAllMembers } from '../controllers/membership.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/membership/subscribe — Subscribe or send newsletter
router.post('/subscribe', subscribe);

// GET /api/membership/check/:email — Check membership status
router.get('/check/:email', protect, checkMembership);

// GET /api/membership/all — List all members (admin)
router.get('/all', protect, authorize('admin'), getAllMembers);

export default router;
