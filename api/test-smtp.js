#!/usr/bin/env node
/**
 * SMTP Connection Test Script
 * 
 * Usage: node test-smtp.js
 * 
 * This script tests the Gmail SMTP connection with credentials from .env file
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// Get credentials from .env
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();

if (!smtpUser || !smtpPass) {
  console.error('❌ ERROR: SMTP_USER or SMTP_PASS not found in .env file');
  console.error('Please add SMTP_USER and SMTP_PASS to your .env file');
  process.exit(1);
}

// Clean password (remove spaces)
const cleanedPassword = smtpPass.replace(/\s+/g, '');

console.log('🔍 Testing SMTP Connection...');
console.log('📧 SMTP User:', smtpUser);
console.log('🔑 Password Length:', cleanedPassword.length, 'characters');
console.log('🔑 Password Preview:', cleanedPassword.length > 0 
  ? `${cleanedPassword.substring(0, 2)}...${cleanedPassword.substring(cleanedPassword.length - 2)}` 
  : 'empty');

if (cleanedPassword.length !== 16) {
  console.warn('⚠️  WARNING: App Password should be exactly 16 characters');
  console.warn('   Current length:', cleanedPassword.length);
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: smtpUser,
    pass: cleanedPassword,
  },
});

// Test connection
console.log('\n🔄 Verifying SMTP connection...\n');

transporter.verify()
  .then(() => {
    console.log('✅ SUCCESS! SMTP connection is working correctly!');
    console.log('✅ Your App Password is valid and Gmail accepts it.');
    console.log('\n📝 You can now send emails from your application.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ FAILED! SMTP connection failed.');
    console.error('\n📋 Error Details:');
    console.error('   Code:', error.code || 'N/A');
    console.error('   Message:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔧 FIX STEPS:');
      console.error('   1. Go to: https://myaccount.google.com/security');
      console.error('   2. Enable "2-Step Verification" (if not already enabled)');
      console.error('   3. Go to: https://myaccount.google.com/apppasswords');
      console.error('   4. Click "Select app" → Choose "Mail"');
      console.error('   5. Click "Select device" → Choose "Other (Custom name)"');
      console.error('   6. Type: "AlumniAccel"');
      console.error('   7. Click "Generate"');
      console.error('   8. Copy the 16-character password (remove ALL spaces)');
      console.error('   9. Update SMTP_PASS in .env file');
      console.error('   10. Restart your server');
      console.error('\n📖 See SMTP_SETUP_GUIDE.md for detailed instructions');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n🔧 FIX: Check your internet connection and SMTP settings');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n🔧 FIX: Connection timeout - check network/firewall');
    }
    
    process.exit(1);
  });

