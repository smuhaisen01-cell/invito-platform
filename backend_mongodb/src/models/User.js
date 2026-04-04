const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
  },
  isActive: { type: Boolean, default: true },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  emailVerify: {
    type: Boolean,
    default: false
  },
 
  onBoarding: {
    type: Boolean,
    default: false
  },
  signupType: {
    type: String,
    enum: ['email', 'gmail'],
    default: 'email'
  },
  emailVerifyAt: {
    type: Date,
    default: null
  },
  EventTrial :{
    type : Number,
    default: 2,
  },
  
  passwordResetAt: {
    type: Date,
    default: null
  },
  subscription: {
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
    planName : {type:String},
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true },
    source: { type: Object },
    iscancelled: {
    type : Boolean,
    default : false,
  },
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true, transform: function (doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('User', userSchema);