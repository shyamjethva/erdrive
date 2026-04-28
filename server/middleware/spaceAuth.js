import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const checkSpaceAuth = async (req, res, next) => {
    try {
        const spaceAuthToken = req.header('X-Space-Authorization') || req.query.spaceToken;

        if (!spaceAuthToken) {
            return res.status(403).send({ error: 'Second Space access denied. Please authenticate.' });
        }

        const decoded = jwt.verify(spaceAuthToken, process.env.JWT_SECRET);

        if (decoded.spaceType !== 'second' || decoded.id !== req.user._id.toString()) {
            return res.status(403).send({ error: 'Invalid Second Space session.' });
        }

        req.spaceAccess = true;
        next();
    } catch (error) {
        res.status(403).send({ error: 'Second Space session expired or invalid.' });
    }
};
