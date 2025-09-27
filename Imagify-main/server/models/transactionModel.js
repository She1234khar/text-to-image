import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  orderId: { type: String, required: true },
  captureId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  planId: { type: String, required: true },
  creditsAdded: { type: Number, required: true },
  payerEmail: { type: String },
  payerName: { type: String },
  raw: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

const transactionModel = mongoose.models.transaction || mongoose.model('transaction', transactionSchema);

export default transactionModel;



