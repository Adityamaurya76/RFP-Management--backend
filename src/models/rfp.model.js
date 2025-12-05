import mongoose from "mongoose";

const RfpSchema = new mongoose.Schema({
  title: String,
  description: String,
  budget: Number,
  deliveryTimeline: String,
  items: [
    {
      name: String,
      quantity: Number,
      specs: String
    }
  ],
  paymentTerms: String,
  warranty: String,
  vendorsSent: [String],
}, { timestamps: true });

const RFP = mongoose.model("RFP", RfpSchema);

export default RFP;
