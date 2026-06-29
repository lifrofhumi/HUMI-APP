import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { sendWelcomeEmail } from '../utils/email';
import admin from '../utils/firebase';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role, matricNumber } = req.body;

    // Validate Matric Number
    if (!matricNumber || !/^(22|23|24|25|26)\d{7}$/.test(matricNumber)) {
      res.status(400).json({ error: 'Please enter a valid LASU matriculation number. It must contain exactly 9 digits and begin with your admission year (22–26).' });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { matricNumber }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        res.status(400).json({ error: 'Email is already registered' });
      } else {
        res.status(400).json({ error: 'Matriculation number is already registered' });
      }
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        name,
        role: role || 'STUDENT',
        matricNumber,
        profileCompleted: true,
      },
    });

    // Send Welcome Email asynchronously
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile_picture_url: user.profile_picture_url,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.authenticationProvider === 'GOOGLE' && !user.password_hash) {
      res.status(401).json({ error: 'Please login with Google' });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile_picture_url: user.profile_picture_url,
        profileCompleted: user.profileCompleted,
        phone: user.phone,
        faculty: user.faculty,
        department: user.department,
        level: user.level,
        matricNumber: user.matricNumber,
        created_at: user.created_at
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  console.log("Request received to update profile");
  
  try {
    const authReq = req as any;
    console.log("req.user:", authReq.user);
    
    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized: No user found in request' });
      return;
    }

    const { name, profile_picture_url, phone, faculty, department, level, matricNumber } = req.body;

    console.log("Updating database for user:", authReq.user.userId);
    const updatedUser = await prisma.user.update({
      where: { id: authReq.user.userId },
      data: {
        name: name || undefined,
        profile_picture_url: profile_picture_url !== undefined ? profile_picture_url : undefined,
        phone: phone !== undefined ? phone : undefined,
        faculty: faculty !== undefined ? faculty : undefined,
        department: department !== undefined ? department : undefined,
        level: level !== undefined ? level : undefined,
        matricNumber: matricNumber !== undefined ? matricNumber : undefined
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profile_picture_url: true,
        phone: true,
        faculty: true,
        department: true,
        level: true,
        matricNumber: true,
        created_at: true
      }
    });

    console.log("Database updated successfully");
    res.status(200).json({ success: true, message: 'Profile updated successfully', user: updatedUser });
  } catch (err: any) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to update profile',
      stack: err.stack
    });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ error: 'ID token is required' });
      return;
    }

    // Verify Google ID token using Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid: googleId, email, name, picture } = decodedToken;

    if (!email) {
      res.status(400).json({ error: 'Email not provided by Google' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { email } });
    let isLinked = false;

    if (user) {
      // Existing user: Link account if not already linked
      if (user.authenticationProvider !== 'GOOGLE' || !user.googleId) {
        user = await prisma.user.update({
          where: { email },
          data: {
            googleId,
            authenticationProvider: 'GOOGLE',
            lastLogin: new Date(),
          }
        });
        isLinked = true;

        // Generate linked notification
        await prisma.notification.create({
          data: {
            user_id: user.id,
            message: 'Your Google account has been linked successfully.',
            type: 'SUCCESS'
          }
        });
      } else {
        // Just update last login
        user = await prisma.user.update({
          where: { email },
          data: { lastLogin: new Date() }
        });
      }
    } else {
      // New user
      user = await prisma.user.create({
        data: {
          email,
          name: name || 'Google User',
          profile_picture_url: picture,
          role: 'STUDENT',
          googleId,
          authenticationProvider: 'GOOGLE',
          profileCompleted: false,
          lastLogin: new Date(),
        }
      });
      // Send Welcome Email asynchronously
      sendWelcomeEmail(user.email, user.name).catch(console.error);
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: isLinked ? 'Your Google account has been linked successfully.' : 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile_picture_url: user.profile_picture_url,
        profileCompleted: user.profileCompleted
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
};

export const completeProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as any;
    if (!authReq.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { matricNumber, faculty, department, level, phone } = req.body;

    if (!matricNumber || !/^(22|23|24|25|26)\d{7}$/.test(matricNumber)) {
      res.status(400).json({ error: 'Please enter a valid LASU matriculation number. It must contain exactly 9 digits and begin with your admission year (22–26).' });
      return;
    }

    // Check if matric is unique
    const existingMatric = await prisma.user.findUnique({ where: { matricNumber } });
    if (existingMatric && existingMatric.id !== authReq.user.userId) {
      res.status(400).json({ error: 'Matriculation number is already registered' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: authReq.user.userId },
      data: {
        matricNumber,
        faculty,
        department,
        level,
        phone,
        profileCompleted: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        profile_picture_url: updatedUser.profile_picture_url,
        profileCompleted: updatedUser.profileCompleted
      }
    });
  } catch (error) {
    console.error('Complete Profile Error:', error);
    res.status(500).json({ error: 'Failed to complete profile' });
  }
};

export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as any;
    if (!authReq.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: authReq.user.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.authenticationProvider === 'GOOGLE' && !user.password_hash) {
      res.status(400).json({ error: 'Google accounts do not have a password' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash!);
    if (!isMatch) {
      res.status(400).json({ error: 'Incorrect current password' });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: newPasswordHash }
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};
