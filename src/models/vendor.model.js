import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema({
  name: String,
  email: String,
  contactPerson: String
}, { timestamps: true });

const Vender = mongoose.model("Vender", VendorSchema);

export default Vender;
