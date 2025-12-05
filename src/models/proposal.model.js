import mongoose from "mongoose";

const ProposalSchema = new mongoose.Schema({
  rfpId: mongoose.Schema.Types.ObjectId,
  vendorId: mongoose.Schema.Types.ObjectId,
  vendorEmail: String,
  vendorName: String,
  rawEmail: String,
  parsedData: Object,
  aiSummary: String,
  score: Number,
}, { timestamps: true });


const Proposal = mongoose.model("Proposal", ProposalSchema);

export default Proposal;
