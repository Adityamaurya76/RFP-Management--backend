import { ApiResponse } from "../utils/api-response.js";
import  { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import RFP  from "../models/rfp.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Vendor from "../models/vendor.model.js";
import { compareProposalsAI, generateRfpEmailBody }from "../services/ai.service.js";
import { sendEmail } from "../services/email.service.js";
import Proposal from "../models/proposal.model.js";

let genAI = null;

const getGeminiClient = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const cleanJsonResponse = (text) => {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
};

const generateRFP = asyncHandler(async (req, res) => {
    try{
      const { text } = req.body;

      if(!text) {
        throw new ApiError(400, "Text is required");
      }
     
    const prompt = `
      Convert the following procurement request into clean structured JSON:
      Required fields:
      - title
      - description
      - budget
      - deliveryTimeline
      - paymentTerms
      - warranty
      - items: [{ name, quantity, specs }]
      
      User request: ${text}

      Return only JSON.
    `;
    const model = getGeminiClient().getGenerativeModel({ model: "gemini-2.0-flash" });
    const aiRes = await model.generateContent(prompt);
    let structured = aiRes.response.text();
    structured = JSON.parse(cleanJsonResponse(structured));
    const rfp = await RFP.create(structured);
   
    return res.status(201).json(new ApiResponse(200, rfp, "data retrieve successfully"));
    } catch (error) {
       console.log(error);
       throw new ApiError(400, [], "Something went wrong" );
    }
})

const sendRfpToVendors = asyncHandler(async (req, res) => {
  const { rfpId, vendorIds } = req.body;

  if (!rfpId || !vendorIds || vendorIds.length === 0) {
    throw new ApiError(400, "rfpId and vendorIds are required");
  }

  const rfp = await RFP.findById(rfpId);

  if (!rfp) throw new ApiError(404, "RFP not found");

  const vendors = await Vendor.find({ _id: { $in: vendorIds } });

  if (vendors.length === 0) {
    throw new ApiError(404, "No valid vendors found");
  }
  let results = [];
  for (const vendor of vendors) {
    const htmlBody = await generateRfpEmailBody(rfp, vendor.name);

    const response = await sendEmail({
      to: vendor.email,
      subject: `Request for Proposal: ${rfp.title}`,
      html: htmlBody,
    });

    results.push({
      vendor: vendor.name,
      email: vendor.email,
      status: response.success ? "sent" : "failed",
    });
  }

  if (!Array.isArray(rfp.vendorsSent)) {
    rfp.vendorsSent = [];
  }

  rfp.vendorsSent.push(...vendorIds);
  await rfp.save();

  return res.status(200).json(new ApiResponse(200, { results }, "RFP sent to vendors successfully"));
});

const compareProposals = asyncHandler(async (req, res) => {
  const rfpId = req.params.id;

  const rfp = await RFP.findById(rfpId);

  if (!rfp) throw new ApiError(404, "RFP not found");
  const proposals = await Proposal.find({ rfpId });

  if (proposals.length === 0) {
    throw new ApiError(404, "No proposals received for this RFP yet");
  }

  const formattedProposals = proposals.map((p) => ({vendorEmail: p.vendorEmail, vendorId: p.vendorId, parsedData: p.parsedData}));
  const result = await compareProposalsAI(rfp, formattedProposals);

  return res.status(200).json(new ApiResponse(200, result, "Comparison generated successfully")
  );
});

const listRFPs = asyncHandler(async (req, res) => {
  const rfps = await RFP.find().sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, rfps, "RFPs fetched successfully"));
});

const getRFPById = asyncHandler(async (req, res) => {
  const rfp = await RFP.findById(req.params.id);
  
  if (!rfp) {
    throw new ApiError(404, "RFP not found");
  }
  
  return res.status(200).json(new ApiResponse(200, rfp, "RFP fetched successfully"));
});

const getProposalsByRFP = asyncHandler(async (req, res) => {
  const rfpId = req.params.id;
  
  const rfp = await RFP.findById(rfpId);
  if (!rfp) {
    throw new ApiError(404, "RFP not found");
  }
  
  const proposals = await Proposal.find({ rfpId }).sort({ createdAt: -1 });
  
  return res.status(200).json(new ApiResponse(200, proposals, "Proposals fetched successfully"));
});

export { generateRFP, sendRfpToVendors, compareProposals, listRFPs, getRFPById, getProposalsByRFP };
