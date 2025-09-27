import express from "express";
import {
  registerUser,
  loginUser,
  userCredits,
  buyCredits,
} from "../controllers/userController.js";
import userAuth from "../middlewares/auth.js";
import transactionModel from "../models/transactionModel.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/credits", userAuth, userCredits);
userRouter.post("/buy", userAuth, buyCredits);
userRouter.get('/transactions', userAuth, async (req, res)=>{
  try{
    const { userId } = req.body;
    const txns = await transactionModel.find({userId}).sort({createdAt:-1});
    res.json({success:true, transactions: txns});
  }catch(err){
    res.json({success:false, message: err.message});
  }
})

export default userRouter;
