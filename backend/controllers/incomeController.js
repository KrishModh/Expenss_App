import { Income } from "../models/Income.js";

export const getIncomes = async (req, res) => {
  const incomes = await Income.find({ user: req.user._id }).sort({ date: -1 });
  res.json({ incomes });
};

export const createIncome = async (req, res) => {
  const income = await Income.create({
    ...req.body,
    user: req.user._id
  });

  res.status(201).json({ income });
};

export const updateIncome = async (req, res) => {
  const income = await Income.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!income) {
    return res.status(404).json({ message: "Income not found" });
  }

  res.json({ income });
};

export const deleteIncome = async (req, res) => {
  const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!income) {
    return res.status(404).json({ message: "Income not found" });
  }

  res.json({ message: "Income deleted" });
};
