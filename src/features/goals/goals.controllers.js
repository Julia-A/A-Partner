import { get } from "mongoose";
import asyncHandler from "../../utils/asyncHandler.js";
import { goalServices } from "./goals.services.js";

// create major goal
const create = asyncHandler(async (req, res) => {
  const { title, description, startDate, targetDate } = req.body;

  const userId = req.user.id;

  const result = await goalServices.create(userId, {
    title,
    description,
    startDate,
    targetDate,
  });

  res.status(201).json({ goal: result });
});

const listAllGoals = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, sort, page, limit } = req.query;

  const result = await goalServices.listByUser(userId, {
    status,
    sort,
    page,
    limit,
  });

  res.json({
    goals: result.goals,
    total: result.total,
    page: result.page,
    limit: result.limit,
  });
});

const getGoalById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { goalId } = req.params;

  const result = await goalServices.getById(userId, goalId);

  res.json({ goal: result });
});

const updateGoal = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { goalId } = req.params;

  const { title, description, startDate, targetDate } = req.body;

  const result = await goalServices.update(userId, goalId, {
    title,
    description,
    startDate,
    targetDate,
  });

  res.json({ goal: result });
});

const delete_ = asyncHandler(async (req, res) => {
  const result = await goalServices.delete_(req.user.id, req.params.goalId);

  res.json({ message: "Goal deleted" });
});

const complete = asyncHandler(async (req, res) => {
  const result = await goalServices.complete(req.user.id, req.params.goalId);

  res.json({ goal: result });
});

const uncomplete = asyncHandler(async (req, res) => {
  const result = await goalServices.uncomplete(req.user.id, req.params.goalId);

  res.json({ goal: result });
});

// create sub goal
// const createSubGoal = asyncHandler(async(req, res) => {
//   const {title, description} = req.body

//   const userId = req.user.id
//   const goalId = req.params

//   const result = await createSubGoal({
//     userId,
//     goalId,
//     title,
//     description
//   })

//   res.status(200).json({result})
// })

export const goalControllers = {
  create,
  listAllGoals,
  getGoalById,
  updateGoal,
  delete_,
  complete,
  uncomplete
};
