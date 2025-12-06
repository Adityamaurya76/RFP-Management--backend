import { ImapFlow } from "imapflow";
import { parseVendorEmail } from "./ai.service.js";
import Proposal from "../models/proposal.model.js";
import Vendor from "../models/vendor.model.js";
import RFP from "../models/rfp.model.js";

let lastSeenUid = 0;

export const startEmailListener = async () => {
  console.log("Starting email listener...");
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
      const messages = [];
      for await (const message of client.fetch("1:*", { envelope: true, uid: true })) {
        messages.push(message);
      }
      
      if (messages.length === 0) {
        console.log("📭 No emails in inbox");
        return;
      }
      const latestMessage = messages[messages.length - 1];

      if (lastSeenUid === 0) {
        lastSeenUid = latestMessage.uid;
        console.log(`📬 Email listener ready. Watching for new emails (last UID: ${lastSeenUid})`);
        return;
      }

      const newMessages = messages.filter(m => m.uid > lastSeenUid);
      
      if (newMessages.length > 0) {
        console.log(`📨 ${newMessages.length} new email(s) detected!`);
        
        for (const msg of newMessages) {
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
    console.log("IMAP Error:", error.message);
  } finally {
    await client.logout();
  }
};

const processEmail = async (message) => {
  try {
    const emailBody = message.source.toString();
    const vendorEmail = message.envelope.from?.[0]?.address;
    const subject = message.envelope.subject || "";

    if (vendorEmail === process.env.IMAP_USER) {
      console.log("Skipping own email");
      return;
    }

    console.log("New Email From:", vendorEmail);
    console.log("Subject:", subject);
   
    console.log("Parsing with AI...");
    const parsedData = await parseVendorEmail(emailBody);
    console.log("AI Parsed Data:", JSON.stringify(parsedData, null, 2));

    const vendor = await Vendor.findOne({ email: vendorEmail });

    let rfp = null;
    let matchedTitle = null;

    const rfpMatch = subject.match(/(?:Re:\s*)?Request for Proposal:\s*(.+)/i);
    if (rfpMatch) {
      matchedTitle = rfpMatch[1].trim();
    }

    if (vendorEmail && matchedTitle) {
      const vendorsWithEmail = await Vendor.find({ email: vendorEmail });
      if (vendorsWithEmail.length > 0) {
        const vendorIds = vendorsWithEmail.map(v => v._id);
        rfp = await RFP.findOne({ 
          vendorsSent: { $in: vendorIds },
          title: { $regex: matchedTitle, $options: 'i' },
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).sort({ createdAt: -1 });
        if (rfp) {
          console.log("Matched RFP by vendor + title:", rfp.title);
        }
      }
    }

    if (!rfp && vendorEmail) {
      const vendorsWithEmail = await Vendor.find({ email: vendorEmail });
      if (vendorsWithEmail.length > 0) {
        const vendorIds = vendorsWithEmail.map(v => v._id);
        rfp = await RFP.findOne({ 
          vendorsSent: { $in: vendorIds },
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).sort({ createdAt: -1 });
        if (rfp) {
          console.log("Matched RFP by vendor (most recent):", rfp.title);
        }
      }
    }
    
    if (!rfp && matchedTitle) {
      const allMatchingRFPs = await RFP.find({ 
        title: { $regex: `^${matchedTitle}$`, $options: 'i' }
      }).sort({ createdAt: -1 });
      
      if (allMatchingRFPs.length > 0) {
        rfp = allMatchingRFPs[0];
        console.log("Matched RFP by title (most recent):", rfp.title);
        console.log(`Found ${allMatchingRFPs.length} RFPs with same title, using most recent`);
      }
    }
    
    if (!rfp) {
      console.log("Could not match RFP for:", matchedTitle || subject);
    }

    const proposal = await Proposal.create({
      vendorEmail,
      vendorName: vendor?.name || vendorEmail.split('@')[0],
      vendorId: vendor?._id || null,
      rfpId: rfp?._id || null,
      rawEmail: emailBody,
      parsedData,
    });

    console.log("Proposal saved successfully! ID:", proposal._id);

  } catch (err) {
    console.log("Email Processing Error:", err.message);
  }
};
