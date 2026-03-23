const jwt = require('jsonwebtoken');
require('dotenv').config();

async function test() {
    try {
        const token = jwt.sign({ userId: "650000000000000000000000" }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        console.log("Token:", token);
        const res = await fetch("http://localhost:5000/api/customers/search?q=", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Data:", data);
    } catch(err) {
        console.error("FAIL:", err.message);
    }
}
test();
