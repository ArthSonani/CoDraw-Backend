import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const authenticateUser = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const signup = async (req, res) => {
  console.log('Signup attempt:', req.body);
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    });

    res.status(201).json({
      message: 'User created and logged in',
      user: { id: user._id, name: user.name }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  console.log('Login attempt:', req.body);
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'User not found' });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(400).json({ error: 'Invalid password' });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  });

  res.json({ message: 'Login successful', user: { id: user._id, name: user.name } });
};

export const logout = (req, res) => {
  res.cookie('token', '', { expires: new Date(0), httpOnly: true });
  res.status(200).json({ message: 'Logout successful' });
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

export default {
  authenticateUser,
  signup,
  login,
  logout,
  me,
};
