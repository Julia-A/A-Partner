import mongoose from "mongoose";

const stepSchema = mongoose.Schema({
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {timestamps: true})

stepSchema.index({milestoneId: 1, status: 1})
stepSchema.index({milestoneId: 1, createdAt: 1})
stepSchema.index({status: 1, endDate: 1}) // For overdue queries


export const Step = mongoose.model('Step', stepSchema)
