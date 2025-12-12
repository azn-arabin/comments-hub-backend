import mongoose from "mongoose";
import User from "../models/User";
import Comment from "../models/Comment";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/comments-db"
    );
    console.log("MongoDB connected");
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Comment.deleteMany({});

  // Create users
  const userData = [
    { username: "Alice", email: "alice@example.com", password: "password1" },
    { username: "Bob", email: "bob@example.com", password: "password2" },
    {
      username: "Charlie",
      email: "charlie@example.com",
      password: "password3",
    },
    { username: "Diana", email: "diana@example.com", password: "password4" },
    { username: "Eve", email: "eve@example.com", password: "password5" },
  ];
  const users = [];
  for (const data of userData) {
    const user = new User({
      username: data.username,
      email: data.email,
      password: data.password,
    });
    await user.save();
    users.push(user);
  }
  console.log("Users created");

  // Create comments
  const commentContents = [
    "This is a great article! I really enjoyed reading it.",
    "I have a different opinion on this topic. What do you think?",
    "Thanks for sharing this information. Very helpful!",
    "I agree with the points made here. Well written.",
    "This made me think differently about the subject.",
    "Can you elaborate more on this point?",
    "Interesting perspective. I hadn't considered that before.",
    "I found this very insightful. Keep up the good work!",
    "This resonates with my own experiences.",
    "Looking forward to more content like this.",
  ];
  const comments = [];
  for (const user of users) {
    for (let j = 0; j < 5; j++) {
      const comment = new Comment({
        content: `${commentContents[j]} - by ${user.username}`,
        pageId: "page-123",
        author: user._id,
        likes: [],
        dislikes: [],
        replies: [],
      });
      await comment.save();
      comments.push(comment);
    }
  }
  console.log("Top-level comments created");

  // Add some replies
  const replyContents = [
    "I completely agree with you!",
    "That's a good point. Thanks for sharing.",
    "I hadn't thought of it that way.",
    "Could you provide more details?",
    "This is very helpful. Appreciate it!",
  ];
  const allComments = [...comments];
  for (const parentComment of comments) {
    const numReplies = Math.floor(Math.random() * 3); // 0-2 replies
    for (let k = 0; k < numReplies; k++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const reply = new Comment({
        content: `${replyContents[k % replyContents.length]} - Reply by ${
          randomUser.username
        }`,
        pageId: parentComment.pageId, // same page
        author: randomUser._id,
        parentComment: parentComment._id,
        likes: [],
        dislikes: [],
        replies: [],
      });
      await reply.save();
      allComments.push(reply);
    }
  }
  console.log("Replies added");

  // Add random likes and dislikes
  for (const comment of allComments) {
    const numLikes = Math.floor(Math.random() * 5);
    const numDislikes = Math.floor(Math.random() * 3);
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    comment.likes = shuffledUsers.slice(0, numLikes).map((u) => u._id);
    comment.dislikes = shuffledUsers
      .slice(numLikes, numLikes + numDislikes)
      .map((u) => u._id);
    await comment.save();
  }
  console.log("Likes and dislikes added");

  console.log("Seeding completed");
  process.exit(0);
};

seed().catch(console.error);
