const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const { validateAccountCreation } = require("../middleware/validation");
// const limiter = require("../middleware/limiter");
const throttle = require("../utils/constants");

/**
 * @swagger
 * /api/account/create:
 *   post:
 *     summary: Create a new account
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (must be unique)
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Password (min 8 chars, must contain uppercase, lowercase, number, and special character)
 *                 example: "SecurePass123!"
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: User's full name (letters and spaces only)
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: User ID
 *                 email:
 *                   type: string
 *                   description: User email
 *                 name:
 *                   type: string
 *                   description: User name
 *                 isEmailVerified:
 *                   type: boolean
 *                   description: Email verification status
 *                 isActive:
 *                   type: boolean
 *                   description: Account status
 *                 role:
 *                   type: string
 *                   enum: [user, admin]
 *                   description: User role
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Account creation timestamp
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Last update timestamp
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *                       value:
 *                         type: string
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User with this email already exists"
 *       500:
 *         description: Internal server error
 */
router.post("/create", validateAccountCreation, accountController.create);

module.exports = router;
