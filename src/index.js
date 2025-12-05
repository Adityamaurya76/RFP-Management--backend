import dotenv from 'dotenv';
import { startEmailListener } from "./services/email-listener.service.js";

dotenv.config({
    path: "./.env"
});

import app from "./app.js";
import connectDB from './db/database.js';

const port = process.env.PORT;

connectDB().then(() => {
   app.listen(port, () => {
       console.log(`Server is running on port ${port}`);
       
       // Start IMAP email listener for vendor responses
       startEmailListener();
       console.log(`📧 Email listener started - waiting for vendor responses...`);
   });
}).catch((error) => {
   console.error('MongoDB connection error:', error);
   process.exit(1);
});

