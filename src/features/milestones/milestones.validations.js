import Joi from 'joi'

export const milestoneSchema = Joi.object({
  title: Joi.string().trim().max(200).required()
})


export const getMilestoneByIdSchema = Joi.object({
  milestoneId: Joi.string().required()
})

export const updateMilestoneSchema = Joi.object({
  title: Joi.string().trim().min(1).empty("").optional()
}).min(1);
