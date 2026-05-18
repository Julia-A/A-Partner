import ApiError from "../utils/ApiError.js";

const joiValidate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next(new ApiError(400, error.details.map((d) => d.message)));
    } else if (property === 'query') {
      Object.assign(req.query, value)
      next();
    } else {
      req[property] = value;
      next();
    }
  };
};

export default joiValidate;


// http://localhost:3000/api/auth/register?name=adeiola&klklf=jnjncr


// http://localhost:3000/api/auth/register/:id
