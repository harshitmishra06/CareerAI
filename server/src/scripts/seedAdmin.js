import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';

const seedAdmin = async () => {
  try {
    console.log('🌱 Starting CareerAI Admin Seeding Script...');
    await connectDB();

    const adminEmail = (ENV.ADMIN_EMAIL || 'admin@careerai.local').toLowerCase();
    const adminPassword = ENV.ADMIN_PASSWORD || 'Admin@CareerAI2026!';
    const adminName = ENV.ADMIN_NAME || 'CareerAI Platform Admin';

    // Check if an admin already exists with this email or role
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`ℹ️ Admin account already exists: [${existingAdmin.email}] (Role: ${existingAdmin.role})`);
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`✅ Updated account [${existingAdmin.email}] role to 'admin'.`);
      }
    } else {
      const newAdmin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true
      });

      console.log(`🎉 Successfully created Platform Administrator:`);
      console.log(`   - Name: ${newAdmin.name}`);
      console.log(`   - Email: ${newAdmin.email}`);
      console.log(`   - Role: ${newAdmin.role}`);
      console.log(`   - ID: ${newAdmin._id}`);
      console.log(`ℹ️ Use the credentials configured in your environment to log in.`);
    }

    await disconnectDB();
    console.log('🌱 Admin seeding process finished successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin account:', error);
    await disconnectDB();
    process.exit(1);
  }
};

seedAdmin();
