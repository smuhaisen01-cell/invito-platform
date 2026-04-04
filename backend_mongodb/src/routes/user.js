const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { confirmEmail } = require('../controllers/userController');
const { verifyEmailToken } = require('../controllers/userController');
const { verifyEmailTokenPost } = require('../controllers/userController');
const authMiddleware  = require('../middleware/auth')
// Example: router.get('/me', userController.getMe);

router.post('/confirmEMAIL', confirmEmail);
router.get('/verifyemail', verifyEmailToken);
router.get('/getUsers',userController.getAllUser);
router.get('/getUser', authMiddleware.verify(),userController.getUser);
// router.post('/verifyToken', verifyEmailTokenPost);
router.post('/sendInvite', authMiddleware.verify(),userController.sendInvite);
router.post('/setNewPassword', userController.setNewPassword);
router.post('/getAllUser',authMiddleware.verify(), userController.getAllUsers);
router.get('/callcellSubscribe',authMiddleware.verify(), userController.cancelSubscription);
// router.post('/getAllUsercount', userController.getAllUsers);

module.exports = router; 