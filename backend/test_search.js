const mongoose = require('mongoose');
require('dotenv').config();
const Customer = require('./models/Customer');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        
        const filter = { createdBy: "650000000000000000000000" }; 
        const regex = new RegExp('', 'i');
        // Test with and without $or
        filter.$or = [{ name: regex }, { phone: regex }];
        
        console.log("Filter:", filter);
        const customers = await Customer.find(filter).sort({ createdAt: -1 });
        console.log("Found customers:", customers.length);
    } catch(err) {
        console.error("FAIL:", err);
    } finally {
        await mongoose.disconnect();
    }
}
test();
