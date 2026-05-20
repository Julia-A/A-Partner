import Joi from "joi";

export const createStepsSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),

  startDate: Joi.string().isoDate().required(),

  endDate: Joi.string().isoDate().required(),
});

export const validateMilestoneId = Joi.object({
  milestoneId: Joi.string().trim().required(),
});

export const validateStepId = Joi.object({
  stepId: Joi.string().trim().required(),
});

export const updateStepSchema = Joi.object({
  title: Joi.string().trim().min(1).empty("").optional(),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
}).min(1);
