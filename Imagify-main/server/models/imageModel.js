import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    prompt: { type: String, required: true },
    imageUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const imageModel = mongoose.models.image || mongoose.model("image", imageSchema);

export default imageModel;

