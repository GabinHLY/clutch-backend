import express from 'express';
import {
    register,
    login,
    getMe,
    uploadProfilePicture,
    updateProfile,
    deleteAccount,
    requestPasswordReset,
    resetPassword,
    getAllUsers,
    getUserById,
    logout
} from '../interfaces/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import upload from '../config/multer.js';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/me', authMiddleware, getMe);
router.get('/:id', getUserById);

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ success: true, message: "Déconnexion réussie." });
});

router.patch('/profile', authMiddleware, updateProfile);
router.delete('/account', authMiddleware, deleteAccount);
router.post('/upload', authMiddleware, upload.single("profile_picture"), uploadProfilePicture);

router.post('/reset-password', requestPasswordReset);
router.post('/reset-password/confirm', resetPassword);

export default router;
