const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const User = require('../src/models/User');

async function seedAdminUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (!existingAdmin) {
            const adminUser = await User.create({
                studentId: '10000000',
                name: 'System Administrator',
                email: 'admin@college.edu',
                password: 'admin@12345', // Will be hashed automatically
                role: 'admin',
            });
            console.log('✓ Admin user created successfully');
            console.log(`  Student ID: 10000000`);
            console.log(`  Password: admin@12345`);
        } else {
            console.log('✓ Admin user already exists');
        }

        // Check if TPC already exists
        const existingTPC = await User.findOne({ role: 'tpc' });
        if (!existingTPC) {
            const tpcUser = await User.create({
                studentId: '10000001',
                name: 'TPC Department',
                email: 'tpc@college.edu',
                password: 'tpc@12345', // Will be hashed automatically
                role: 'tpc',
            });
            console.log('✓ TPC user created successfully');
            console.log(`  Student ID: 10000001`);
            console.log(`  Password: tpc@12345`);
        } else {
            console.log('✓ TPC user already exists');
        }

        console.log('\n✓ Database seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error.message);
        process.exit(1);
    }
}

seedAdminUsers();
