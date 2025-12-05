import Vendor from "../models/vendor.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const create = asyncHandler(async (req, res) => {
  const vendor = await Vendor.create(req.body);

  return res.status(201).json(new ApiResponse(201, vendor, "Vendor created successfully"));
});

const list = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find().sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, vendors, "Vendors fetched successfully"));
});

const details = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);

  if (!vendor) {
    throw new ApiError(404, [], "Vendor not found");
  }

  return res.status(200).json(new ApiResponse(200, vendor, "Vendor fetched successfully"));
});

const update = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });

  if (!vendor) {
    throw new ApiError(404, [], "Vendor not found");
  }

  return res.status(200).json(new ApiResponse(200, vendor, "Vendor updated successfully"));
});

const venderDelete = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findByIdAndDelete(req.params.id);

  if (!vendor) {
    throw new ApiError(404, [], "Vendor not found");
  }

  return res.status(200).json(new ApiResponse(200, null, "Vendor deleted successfully"));
});

export {create, list, details, update, venderDelete };