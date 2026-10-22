import express from 'express';
import { subscribe, checkMembership, getAllMembers } from '../controllers/membership.controller.js';

const router = express.Router();

// POST /api/membership/subscribe — Subscribe or send newsletter
router.post('/subscribe', subscribe);

// GET /api/membership/check/:email — Check membership status
router.get('/check/:email', checkMembership);

// GET /api/membership/all — List all members (admin)
router.get('/all', getAllMembers);

export default router;
