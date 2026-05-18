import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(3).required(),

  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required(),

  password: Joi.string().min(8).required(),
}).options({
  abortEarly: false, // show all errors, not just the first
  stripUnknown: true, // remove unwanted fields/ fields not defined in the schema
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required(),

  password: Joi.string().trim().required(),
}).options({
  abortEarly: false, // show all errors, not just the first
  stripUnknown: true, // remove unwanted fields/ fields not defined in the schema
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().required(),
}).options({
  abortEarly: false, // show all errors, not just the first
  stripUnknown: true, // remove unwanted fields/ fields not defined in the schema
});

export const verifyResetTokenSchema = Joi.object({
  token: Joi.string().trim().required(),
}).options({
  abortEarly: false, // show all errors, not just the first
  stripUnknown: true, // remove unwanted fields/ fields not defined in the schema
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().required(),

  newPassword: Joi.string().trim().required().min(8),
}).options({
  abortEarly: false, // show all errors, not just the first
  stripUnknown: true, // remove unwanted fields/ fields not defined in the schema
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().trim().required().min(8),

  newPassword: Joi.string().trim().required().min(8),

  currentRefreshToken: Joi.string().trim().required(),
}).options({
  abortEarly: false, // show all errors, not just the first
  stripUnknown: true, // remove unwanted fields/ fields not defined in the schema
});
