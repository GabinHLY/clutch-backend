import express from 'express';
import {
    register,
    login,
    logout,
    getMe,
    uploadProfilePicture,
    updateProfile,
    deleteAccount,
    requestPasswordReset,
    resetPassword,
    getAllUsers,
    getUserById
} from '../interfaces/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import upload from '../config/multer.js';

const router = express.Router();

// Routes de gestion des utilisateurs
router.get('/', getAllUsers);
router.get('/me', authMiddleware, getMe);
router.get('/:id', getUserById);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.patch('/profile', authMiddleware, updateProfile);
router.delete('/account', authMiddleware, deleteAccount);
router.post('/upload', authMiddleware, upload.single("profile_picture"), uploadProfilePicture);

// Routes de réinitialisation de mot de passe
router.post('/reset-password', requestPasswordReset);
router.post('/reset-password/confirm', resetPassword);

export default router;