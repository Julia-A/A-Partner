import BaseJoi from "joi";
import JoiDate from "@joi/date";

const Joi = BaseJoi.extend(JoiDate);

export const goalSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),

  startDate: Joi.string().isoDate().required(),

  targetDate: Joi.string().isoDate().required(),

  description: Joi.string().trim().min(1).max(2000).required(),
});

export const listAllGoalsSchema = Joi.object({
  status: Joi.string().valid("active", "completed").optional(),
  sort: Joi.string()
    .valid("created_desc", "created_asc", "target_date")
    .default("created_desc"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

export const getSpecificGoalSchema = Joi.object({
  goalId: Joi.string().required(),
});

export const updateGoalSchema = Joi.object({
  title: Joi.string().trim().min(1).empty("").optional(),
  description: Joi.string().trim().min(1).empty("").optional(),
  startDate: Joi.string().isoDate().optional(),
  targetDate: Joi.string().isoDate().optional(),
}).min(1);
