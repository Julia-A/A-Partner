import Joi from 'joi'

export const milestoneSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().max(2000).allow("").optional(),
  startDate: Joi.string().isoDate().optional().allow(null, ""),
  targetDate: Joi.string().isoDate().optional().allow(null, "")
})


export const getMilestoneByIdSchema = Joi.object({
  milestoneId: Joi.string().required()
})

export const updateMilestoneSchema = Joi.object({
  title: Joi.string().trim().min(1).empty("").optional(),
  description: Joi.string().trim().empty("").optional(),
  startDate: Joi.string().isoDate().optional().allow(null, ""),
  targetDate: Joi.string().isoDate().optional().allow(null, "")
}).min(1);
