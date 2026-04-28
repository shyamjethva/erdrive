import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['share', 'system'],
        default: 'share'
    },
    message: {
        type: String,
        required: true
    },
    relatedItemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    relatedItemType: {
        type: String,
        enum: ['file', 'folder'],
        required: false
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
