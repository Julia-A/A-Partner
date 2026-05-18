import asyncHandler from "../../utils/asyncHandler.js";
import { milestoneServices } from "./milestones.services.js";

export const create = asyncHandler(async (req, res) => {
  const { title } = req.body;

  const result = await milestoneServices.create(
    req.user.id,
    req.params.goalId,
    { title},
  );

  res.status(201).json({ milestone: result });
});

export const list = asyncHandler(async (req, res) => {
  const result = await milestoneServices.listByGoal(
    req.user.id,
    req.params.goalId,
  );

  res.json({ milestones: result });
});

export const getById = asyncHandler(async (req, res) => {
  const result = await milestoneServices.getMilestoneById(
    req.user.id,
    req.params.milestoneId,
  );

  res.json({ milestone: result });
});

export const update = asyncHandler(async (req, res) => {
  const { title } = req.body;

  const result = await milestoneServices.update(
    req.user.id,
    req.params.milestoneId,
    { title },
  );

  res.json({ milestone: result });
});

export const delete_ = asyncHandler(async (req, res) => {
  const result = await milestoneServices.delete_(
    req.user.id,
    req.params.milestoneId,
  );

  res.json({ message: "Milestone deleted" });
});
