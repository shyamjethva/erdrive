import express from 'express';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for current user
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipientId: req.user._id })
            .populate('senderId', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(50);
        console.log(`DEBUG: Found ${notifications.length} notifications for user ${req.user.username}`);
        res.send(notifications);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipientId: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).send();
        res.send(notification);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Mark all as read
router.patch('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipientId: req.user._id, isRead: false },
            { isRead: true }
        );
        res.send({ message: 'All marked as read' });
    } catch (error) {
        res.status(500).send(error);
    }
});

export default router;
