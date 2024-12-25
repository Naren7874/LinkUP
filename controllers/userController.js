import User from '../models/userModel.js';
import Post from '../models/postModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import dotenv from 'dotenv';
import { v2 as cloudinary} from 'cloudinary';
import mongoose from 'mongoose';
// import Post from '../../thread_ui/src/components/Post.jsx';

dotenv.config();

// User Sign Up
const signUpUser = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email is already taken." });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: "Username is already taken." });
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
    });

    // Generate token and set it as a cookie
    generateTokenAndSetCookie(newUser._id, res);

    // Send a success response
    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      username: newUser.username,
      bio: newUser.bio,
      profilePic: newUser.profilePic,
    });
  } catch (err) {
    console.error("Error in signUpUser:", err.message);
    res.status(500).json({ error: "An error occurred while signing up." });
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

    if (user.isFrozen) {
			user.isFrozen = false;
			await user.save();
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

// Get Suggested Users
 const getSuggestedUSers = async ( req ,res)=>{
  try {
    // exclude the current user from the suggested user  ans also don't add the user which current user is following

    const currentUserId = req.user._id;
    const userFollowedByCurrentUser =  await User.findById(currentUserId).select("following");

    const users = await User.aggregate([
      {
        $match:{
          _id: { $ne: currentUserId },   
         }
      },
      {
        $sample: { size:10}
      }
    ])

    const filterdUser = users.filter(user => !userFollowedByCurrentUser.following.includes(user._id));
    const suggestedUsers = filterdUser.slice(0,4)

    suggestedUsers.forEach(user => user.password = null);
    res.status(200).json(suggestedUsers);  // return 4 suggested users  which are not followed by the current user.

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
 }

 // Freeze Account
 const freezeAccount = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user) {
			return res.status(400).json({ error: "User not found" });
		}

		user.isFrozen = true;
		await user.save();

		res.status(200).json({ success: true });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

export { signUpUser, signInUser, logoutUser, followUnFollowUser, updateUser ,userProfile ,getSuggestedUSers ,freezeAccount};
