import asyncHandler from "../../utils/asyncHandler.js";
import { stepServices } from "./steps.services.js";

const create = asyncHandler(async (req, res) => {
  const { title, startDate, endDate } = req.body;

  const result = await stepServices.create(
    req.user.id,
    req.params.milestoneId,
    {
      title,
      startDate,
      endDate,
    },
  );

  res.status(201).json({ step: result });
});

const list = asyncHandler(async (req, res) => {
  const result = await stepServices.listByMilestone(
    req.user.id,
    req.params.milestoneId,
  );

  res.json({ steps: result });
});

const update = asyncHandler(async (req, res) => {
  const { title,  startDate, endDate } = req.body;

  const result = await stepServices.update(req.user.id, req.params.stepId, {
    title,
    startDate,
    endDate,
  });

  res.json({ step: result });
});

const complete = asyncHandler(async (req, res) => {
  const result = await stepServices.complete(req.user.id, req.params.stepId);

  res.json({
    step: result.step,
    xpAwarded: result.xpAwarded,
    milestoneCompleted: result.milestoneCompleted,
  });
});

const uncomplete = asyncHandler(async (req, res) => {
  const result = await stepServices.uncomplete(req.user.id, req.params.stepId);

  res.json({
    step: result.step,
    xpDeducted: result.xpDeducted,
    milestoneUncompleted: result.milestoneUncompleted,
  });
});

const delete_ = asyncHandler(async (req, res) => {
  const result = await stepServices.delete_(req.user.id, req.params.stepId);

  res.json({ message: "Step deleted" });
});

const getTodayFocus = asyncHandler(async (req, res) => {
  const result = await stepServices.getTodayFocus(req.user.id);

  res.json({ overdue: result.overdue, today: result.today });
});

const getOverdue = asyncHandler(async (req, res) => {
  const result = await stepServices.getOverdue(req.user.id);

  res.json({ steps: result });
});

export const stepController = {
  create,
  list,
  update,
  complete,
  uncomplete,
  delete_,
  getTodayFocus,
  getOverdue,
};
