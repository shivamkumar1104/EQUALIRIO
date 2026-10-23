/**
 * Membership / Newsletter Controller
 * Handles subscribe, check membership, and send newsletter email.
 */
import Membership from '../models/Membership.js';
import User from '../models/User.js';
import { sendWelcomeEmail } from '../services/email.service.js';

/**
 * POST /api/membership/subscribe
 * Subscribe an email to the newsletter.
 * - If email is already a member → send newsletter email directly
 * - If email belongs to a registered user but not a member → auto-create membership + send email
 * - If email is not registered at all → return membership_required popup
 */
export const subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if already a member
    const existingMember = await Membership.findOne({ email: normalizedEmail });

    if (existingMember) {
      return res.status(200).json({
        success: true,
        status: 'already_member',
        message: 'You are already subscribed to the Privé Privilege Club.',
      });
    }

    // 2. Check if the email belongs to a registered user
    const registeredUser = await User.findOne({ email: normalizedEmail });

    if (registeredUser) {
      if (!registeredUser.emailVerified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before joining the Privé Privilege Club.',
        });
      }

      // Registered user but not yet a member — auto-subscribe
      const newMember = await Membership.create({
        email: normalizedEmail,
        name: registeredUser.name,
        user: registeredUser._id,
        isVerified: true,
        tier: 'standard',
      });

      // Send welcome email
      const emailResult = await sendWelcomeEmail(
        normalizedEmail,
        registeredUser.name || 'Valued Guest'
      );

      return res.status(201).json({
        success: true,
        status: 'subscribed',
        message: emailResult.success
          ? `Welcome to Privé Privilege Club, ${registeredUser.name}! A welcome email has been sent.`
          : `You joined the Privé Privilege Club, ${registeredUser.name}, but the welcome email could not be sent.`,
        emailSent: emailResult.success,
        membership: {
          id: newMember._id,
          email: newMember.email,
          name: newMember.name,
          tier: newMember.tier,
        },
      });
    }

    // 3. Email not registered — prompt for membership/registration
    return res.status(200).json({
      success: true,
      status: 'not_registered',
      message: 'This email is not registered. Please create an account first to join our Privé Privilege Club.',
    });

  } catch (err) {
    console.error('Subscribe error:', err);

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This email is already subscribed.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to process subscription',
    });
  }
};

/**
 * GET /api/membership/check/:email
 * Check if an email is in the membership list.
 */
export const checkMembership = async (req, res) => {
  try {
    const { email } = req.params;
    const normalizedEmail = email.trim().toLowerCase();

    if (req.user.role !== 'admin' && req.user.email !== normalizedEmail) {
      return res.status(403).json({
        success: false,
        message: 'You can only check your own membership status.',
      });
    }

    const member = await Membership.findOne({ email: normalizedEmail });

    return res.status(200).json({
      success: true,
      isMember: !!member,
      membership: member
        ? {
            id: member._id,
            email: member.email,
            name: member.name,
            tier: member.tier,
            subscribedAt: member.subscribedAt,
          }
        : null,
    });
  } catch (err) {
    console.error('Check membership error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to check membership status',
    });
  }
};

/**
 * GET /api/membership/all  (Admin only — for future use)
 * List all membership subscribers.
 */
export const getAllMembers = async (req, res) => {
  try {
    const members = await Membership.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('user', 'name email avatar');

    return res.status(200).json({
      success: true,
      count: members.length,
      members,
    });
  } catch (err) {
    console.error('Get all members error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
    });
  }
};
