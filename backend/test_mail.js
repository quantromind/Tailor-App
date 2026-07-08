require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Subscription = require('./models/Subscription');
const { sendSubscriptionConfirmation } = require('./utils/mailer');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        // Find the most recent user with a subscription
        const sub = await Subscription.findOne({ isActive: true }).sort({ startDate: -1 });
        if (!sub) {
            console.log('⚠️  No active subscription found in DB');
            process.exit(0);
        }
        const user = await User.findById(sub.user);
        if (!user) {
            console.log('⚠️  No user found for subscription');
            process.exit(0);
        }

        console.log('👤 User:', { name: user.name, email: user.email || '(EMPTY)', phone: user.phone });
        console.log('📋 Subscription:', { plan: sub.plan, amount: sub.amount, maxClients: sub.maxClients });

        console.log('\nSending confirmation email...');
        await sendSubscriptionConfirmation({
            userName: user.name,
            companyName: user.companyName,
            userEmail: user.email,
            userPhone: user.phone,
            planName: sub.plan,
            amount: sub.amount,
            maxClients: sub.maxClients,
            currentClients: 5, // example
            isActive: sub.isActive,
            startDate: sub.startDate,
            razorpayOrderId: 'test_order_manual',
        });

        console.log('✅ Done — check quantromind@gmail.com inbox (and spam)');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

test();
