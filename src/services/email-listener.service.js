import { ImapFlow } from "imapflow";
import { parseVendorEmail } from "./ai.service.js";
import Proposal from "../models/proposal.model.js";
import Vendor from "../models/vendor.model.js";
import RFP from "../models/rfp.model.js";

let lastSeenUid = 0;

export const startEmailListener = async () => {
  console.log("🔄 Starting email listener...");
  
  // Check for new emails every 15 seconds
  checkForNewEmails();
  setInterval(checkForNewEmails, 15000);
};

const checkForNewEmails = async () => {
  const client = new ImapFlow({
    host: process.env.IMAP_HOST,
    port: Number(process.env.IMAP_PORT),
    secure: true,
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASS,
    },
    logger: false
  });

  try {
    await client.connect();
    
    const lock = await client.getMailboxLock("INBOX");
    
    try {
      // Get all message UIDs
      const messages = [];
      for await (const message of client.fetch("1:*", { envelope: true, uid: true })) {
        messages.push(message);
      }
      
      if (messages.length === 0) {
        console.log("📭 No emails in inbox");
        return;
      }

      // Get the latest message
      const latestMessage = messages[messages.length - 1];
      
      // Initialize lastSeenUid on first run
      if (lastSeenUid === 0) {
        lastSeenUid = latestMessage.uid;
        console.log(`📬 Email listener ready. Watching for new emails (last UID: ${lastSeenUid})`);
        return;
      }

      // Check for new messages
      const newMessages = messages.filter(m => m.uid > lastSeenUid);
      
      if (newMessages.length > 0) {
        console.log(`📨 ${newMessages.length} new email(s) detected!`);
        
        for (const msg of newMessages) {
          // Fetch full message with body
          const fullMessage = await client.fetchOne(msg.seq.toString(), {
            source: true,
            envelope: true
          });
          
          if (fullMessage?.source) {
            await processEmail(fullMessage);
          }
          
          lastSeenUid = msg.uid;
        }
      }
      
    } finally {
      lock.release();
    }
    
  } catch (error) {
    console.log("❌ IMAP Error:", error.message);
  } finally {
    await client.logout();
  }
};

const processEmail = async (message) => {
  try {
    const emailBody = message.source.toString();
    const vendorEmail = message.envelope.from?.[0]?.address;
    const subject = message.envelope.subject || "";

    // Skip emails from our own system
    if (vendorEmail === process.env.IMAP_USER) {
      console.log("⏭️ Skipping own email");
      return;
    }

    console.log("📥 New Email From:", vendorEmail);
    console.log("📋 Subject:", subject);
    
    // Parse email with AI
    console.log("🤖 Parsing with AI...");
    const parsedData = await parseVendorEmail(emailBody);
    console.log("🤖 AI Parsed Data:", JSON.stringify(parsedData, null, 2));

    // Find vendor
    const vendor = await Vendor.findOne({ email: vendorEmail });

    // Find RFP from subject
    let rfp = null;
    const rfpMatch = subject.match(/Request for Proposal:\s*(.+)/i);
    if (rfpMatch) {
      const title = rfpMatch[1].trim();
      rfp = await RFP.findOne({ title: { $regex: title, $options: 'i' } });
      console.log("📋 Matched RFP:", rfp?.title || "Not found");
    }

    // Save proposal to database
    const proposal = await Proposal.create({
      vendorEmail,
      vendorName: vendor?.name || vendorEmail.split('@')[0],
      vendorId: vendor?._id || null,
      rfpId: rfp?._id || null,
      rawEmail: emailBody,
      parsedData,
    });

    console.log("🟢 Proposal saved successfully! ID:", proposal._id);

  } catch (err) {
    console.log("❌ Email Processing Error:", err.message);
  }
};
