import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { parseVendorEmail } from "../services/ai.service.js";

export const testEmailParse = asyncHandler(async (req, res) => {
  const { body } = req.body;

  const data = await parseVendorEmail(body);
  
  return res.status(200).json(new ApiResponse(200, data, "Parsed successfully"));
});

