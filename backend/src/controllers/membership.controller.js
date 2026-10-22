/**
 * Membership / Newsletter Controller
 * Handles subscribe, check membership, and send newsletter email.
 */
import Membership from '../models/Membership.js';
import User from '../models/User.js';
import { sendWelcomeEmail, sendNewsletterEmail } from '../services/email.service.js';

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
      // Already subscribed — send info email
      const emailResult = await sendNewsletterEmail(
        normalizedEmail,
        existingMember.name || 'Valued Guest',
        {
          subject: '🏨 Your Exclusive Equalirio Resort Updates',
          title: 'Latest from Equalirio Resort & Spa',
          body: `Thank you for being a valued member of our Privé Privilege Club! 
                 We have curated the latest villa releases, seasonal dining experiences, 
                 and exclusive spa wellness retreats just for you. Stay tuned for personalized 
                 offers arriving soon.`,
        }
      );

      // Update last email sent
      existingMember.lastEmailSentAt = new Date();
      await existingMember.save();

      return res.status(200).json({
        success: true,
        status: 'already_member',
        message: 'Exclusive offers have been sent to your email!',
        emailSent: emailResult.success,
      });
    }

    // 2. Check if the email belongs to a registered user
    const registeredUser = await User.findOne({ email: normalizedEmail });

    if (registeredUser) {
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
        message: `Welcome to Privé Privilege Club, ${registeredUser.name}! A welcome email has been sent.`,
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
