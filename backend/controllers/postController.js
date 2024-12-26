import User from "../models/userModel.js";
import Post from "../models/postModel.js"; 
import { v2 as cloudinary} from 'cloudinary';

const getPost = async (req ,res )=>{
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let {img} = req.body;

        // The `postedBy` should be the authenticated user, not coming from req.body
        const postedBy = req.user._id; 

        if (!text) { 
            return res.status(400).json({ error: 'Post must have text content' });
        }

        const user = await User.findById(postedBy);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if(img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }
        // Validate the length of the text
        const maxLength = 500; 
        if (text.length > maxLength) {
            return res.status(400).json({ error: `Text should not exceed ${maxLength} characters` });
        }

        // Create the new post
        const newPost = new Post({ postedBy, text, img });
        await newPost.save();

        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const user = await User.findById(post.postedBy);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user._id.toString()!== req.user._id.toString()) {
            return res.status(401).json({ error: 'Unauthorized to delete this post' });
        }

        if(post.img){
            const imgId = post.img.split('/').pop().split('.')[0]; 
            await cloudinary.uploader.destroy(imgId);
        }

        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Post deleted successfully' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


const likePost = async (req, res) => {
    try {
        const {id:postId} = req.params;
        const userId = req.user._id;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        const isAlreadyLiked = post.likes.includes(userId);
        if (isAlreadyLiked) {
            //dislike the post 
            await Post.updateOne({_id: postId}, {$pull :{likes:userId}});
            res.json({ message: 'Post disliked successfully' })
        }else {
            //like the post
            await Post.updateOne({_id: postId}, {$push :{likes:userId}});
            res.json({ message: 'Post liked successfully' })
        }
    } catch (error) { 
        res.status(500).json({ error: error.message });
    }
}


const replyToPost = async (req, res) => {
	try {
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user._id;
		const userProfilePic = req.user.profilePic;
		const username = req.user.username;

		if (!text) {
			return res.status(400).json({ error: "Text field is required" });
		}

		const post = await Post.findById(postId);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const reply = { userId, text, userProfilePic, username };

		post.replies.push(reply);
		await post.save();

		res.status(200).json(reply);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};


const getFeedPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const following = user.following;
        const feedPost = await Post.find({postedBy:{$in:following}}).sort({createdAt: -1});
        res.status(200).json(feedPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


const getUserPost = async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });
        res.status(200).json(posts);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}
export { createPost ,getPost,deletePost,likePost,getFeedPost,replyToPost, getUserPost};