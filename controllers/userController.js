import User from '../models/userModel.js';
import Post from '../models/postModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v2 as cloudinary} from 'cloudinary';
import mongoose from 'mongoose';
// import Post from '../../thread_ui/src/components/Post.jsx';

dotenv.config();

// User Sign Up
const signUpUser = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    const existingUser = await User.findOne({ email, username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });

    await user.save();

    if (user) {
        // Generate JWT token after successful signup
        const age = 1000 * 60 * 60 * 24 * 7; // 7 days
        const token = jwt.sign(
          {
            id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
          },
          process.env.JWT_SECRET,
          { expiresIn: age }
        );
  
        // Set the token as an HTTP-only cookie
        res
          .cookie('token', token, {
            httpOnly: true,
            maxAge: age,
          })
          .status(201)
          .json(user);
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// User Sign In
const signInUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials!' });
    }

    const age = 1000 * 60 * 60 * 24 * 7; // 7 days

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: age }
    );

    res
      .cookie('token', token, {
        httpOnly: true,
        maxAge: age,
      })
      .status(200)
      .json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// User Logout
const logoutUser = async (req, res) => {
  try {
    res.clearCookie('token', { path: '/' });
    return res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Follow/Unfollow User
const followUnFollowUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't follow/unfollow yourself" });
    }

    if (!currentUser || !userToModify) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      // Unfollow user
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      return res.status(200).json({ message: 'User unfollowed successfully' });
    } else {
      // Follow user
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      return res.status(200).json({ message: 'User followed successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Update User
const updateUser = async (req, res) => {
	const { name, email, username, password, bio } = req.body;
	let { profilePic } = req.body;

	const userId = req.user._id;
	try {
		let user = await User.findById(userId);
		if (!user) return res.status(400).json({ error: "User not found" });

		if (req.params.id !== userId.toString())
			return res.status(400).json({ error: "You cannot update other user's profile" });

		if (password) {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			user.password = hashedPassword;
		}

		if (profilePic) {
			if (user.profilePic) {
				await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profilePic);
			profilePic = uploadedResponse.secure_url;
		}

		user.name = name || user.name;
		user.email = email || user.email;
		user.username = username || user.username;
		user.profilePic = profilePic || user.profilePic;
		user.bio = bio || user.bio;

		user = await user.save();

    // Update the user in the current session

    // find all posts that this user replied to post and update their info 
    await Post.updateMany(
      {"replies.userId":userId},
      {$set:{
        "replies.$[reply].username":user.username,
        "replies.$[reply].userProfilePic": user.profilePic,
      },},
      {arrayFilters: [{ "reply.userId": userId }]}
    )
    
		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in updateUser: ", err.message);
	}
};

// Get User Profile
const userProfile = async (req, res) => {
  const query = req.params.query; // Expecting `query` parameter for username or user ID

  try {
    let user;

    if (mongoose.Types.ObjectId.isValid(query)) {
      // Query by ObjectId
      user = await User.findById(query).select("-password -updatedAt");
    } else {
      // Query by username
      user = await User.findOne({ username: query }).select("-password -updatedAt");
    }

    if (!user) { 
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export { signUpUser, signInUser, logoutUser, followUnFollowUser, updateUser ,userProfile};

