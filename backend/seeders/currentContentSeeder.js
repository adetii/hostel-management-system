require('dotenv').config();
const mongoose = require('mongoose');
const { PublicContent, Admin } = require('../models');

async function clearAndSeedCurrentContent() {
  try {
    console.log('🔄 Starting content seeding from current pages...');
    
    // Get MongoDB connection string from environment variables
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/your-database-name';
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Database connected successfully');
    console.log(`🔗 Connected to: ${mongoose.connection.name}`);
    
    // Get super admin
    let superAdmin = await Admin.findOne({ role: 'super_admin' });
    if (!superAdmin) {
      console.log('❌ No super admin found. Please run the admin seeder first.');
      return;
    }
    
    // Clear existing public content
    await PublicContent.deleteMany({});
    console.log('🗑️ Cleared existing public content');
    
    // Current content from your pages
    const contentData = [
      {
        type: 'faq',
        title: 'Frequently Asked Questions',
        content: `
          <div class="faq-content">
            <h2>Frequently Asked Questions</h2>
            
            <div class="faq-category">
              <h3>📚 Booking & Reservations</h3>
              <div class="faq-item">
                <h4>How do I make a reservation?</h4>
                <p>You can make a reservation through our website, by calling us directly, or visiting our reception. Online bookings are available 24/7 and offer instant confirmation with secure payment processing.</p>
              </div>
              <div class="faq-item">
                <h4>What is your cancellation policy?</h4>
                <p>Free cancellation up to 24 hours before check-in. Cancellations within 24 hours may incur a one-night charge. No-shows will be charged the full amount. Refunds are processed within 5-7 business days.</p>
              </div>
              <div class="faq-item">
                <h4>Do you require a deposit?</h4>
                <p>Yes, we require a refundable security deposit of $50 upon check-in. This covers any potential damages or missing items. The deposit is returned within 24 hours after checkout, subject to room inspection.</p>
              </div>
              <div class="faq-item">
                <h4>Can I extend my stay?</h4>
                <p>Extensions are subject to availability. Please contact reception at least 24 hours before your checkout date. Additional nights will be charged at the current rate.</p>
              </div>
            </div>
            
            <div class="faq-category">
              <h3>🏠 Facilities & Amenities</h3>
              <div class="faq-item">
                <h4>What amenities are included?</h4>
                <p>All rooms include free Wi-Fi, bed linens, towels, and access to common areas including kitchen, lounge, and study spaces. We also provide 24/7 security and reception services.</p>
              </div>
              <div class="faq-item">
                <h4>Is there a kitchen available?</h4>
                <p>Yes, we have a fully equipped communal kitchen with refrigerators, stoves, microwaves, and all necessary cooking utensils. Kitchen hours are 6:00 AM to 11:00 PM.</p>
              </div>
              <div class="faq-item">
                <h4>Do you provide laundry facilities?</h4>
                <p>Yes, coin-operated washing machines and dryers are available 24/7. Detergent can be purchased at reception or you can bring your own.</p>
              </div>
              <div class="faq-item">
                <h4>Is parking available?</h4>
                <p>Free parking is available on a first-come, first-served basis. We also have secure bicycle storage for cyclists.</p>
              </div>
            </div>
            
            <div class="faq-category">
              <h3>🛡️ Safety & Security</h3>
              <div class="faq-item">
                <h4>How secure is the hostel?</h4>
                <p>We have 24/7 security, CCTV monitoring, secure key card access, and individual lockers in each room. Our staff is always available for assistance.</p>
              </div>
              <div class="faq-item">
                <h4>What if I lose my key card?</h4>
                <p>Report lost key cards immediately to reception for security reasons. Replacement cards cost $10 and can be issued during reception hours with proper identification.</p>
              </div>
              <div class="faq-item">
                <h4>Do you provide cleaning services?</h4>
                <p>Common areas are cleaned daily. Room cleaning service is available upon request for an additional fee. Fresh linens are provided weekly, or more frequently upon request.</p>
              </div>
            </div>
          </div>
        `,
        isActive: true
      },
      {
        type: 'terms',
        title: 'Terms & Conditions',
        content: `
          <div class="terms-content">
            <h2>Terms & Conditions</h2>
            <p class="last-updated">Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <div class="terms-section">
              <h3>✅ Acceptance of Terms</h3>
              <p>By accessing and using our hostel services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.</p>
            </div>
            
            <div class="terms-section">
              <h3>📋 Booking & Reservations</h3>
              <p>All bookings are subject to availability and confirmation. A valid form of identification is required at check-in.</p>
              <ul>
                <li>Advance payment may be required for certain bookings</li>
                <li>Cancellation policies apply as per booking terms</li>
                <li>Check-in time: 2:00 PM, Check-out time: 11:00 AM</li>
                <li>Minimum age requirement: 18 years old</li>
              </ul>
            </div>
            
            <div class="terms-section">
              <h3>🛡️ Guest Responsibilities</h3>
              <p>As a guest, you are expected to maintain a respectful and safe environment for all residents.</p>
              <ul>
                <li>Respect other guests and maintain quiet hours (10 PM - 7 AM)</li>
                <li>Keep common areas clean and tidy</li>
                <li>Report any damages or issues immediately</li>
                <li>Follow all safety and security protocols</li>
                <li>Comply with local laws and regulations</li>
              </ul>
            </div>
            
            <div class="terms-section">
              <h3>💳 Payment Terms</h3>
              <p>Payment is due at the time of booking or check-in. We accept major credit cards, debit cards, and cash.</p>
              <ul>
                <li>Security deposit of GH₵50 required upon check-in</li>
                <li>Late payment fees may apply</li>
                <li>Refunds processed within 5-7 business days</li>
                <li>All prices are subject to applicable taxes</li>
              </ul>
            </div>
            
            <div class="terms-section">
              <h3>⚠️ Liability & Damages</h3>
              <p>The hostel is not responsible for loss, theft, or damage to personal belongings. Guests are advised to use provided lockers and secure their valuables.</p>
              <ul>
                <li>Guests are liable for damages to hostel property</li>
                <li>Insurance coverage is recommended</li>
                <li>Report incidents immediately to management</li>
                <li>Emergency procedures must be followed</li>
              </ul>
            </div>
          </div>
        `,
        isActive: true
      },
      {
        type: 'privacy',
        title: 'Privacy Policy',
        content: `
          <div class="privacy-content">
            <h2>Privacy Policy</h2>
            <p class="effective-date">Effective date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p class="intro">Your privacy is important to us. Learn how we collect, use, and protect your information.</p>
            
            <div class="privacy-section">
              <h3>🗄️ Information We Collect</h3>
              <p>We collect information you provide directly to us to ensure the best possible service experience.</p>
              <ul>
                <li>Personal details when making reservations</li>
                <li>Account information for our website</li>
                <li>Communication records for customer support</li>
                <li>Newsletter subscription preferences</li>
                <li>Payment information (securely processed)</li>
              </ul>
            </div>
            
            <div class="privacy-section">
              <h3>🛡️ How We Use Your Information</h3>
              <p>Your information helps us provide, improve, and personalize our services for you.</p>
              <ul>
                <li>Process bookings and provide our services</li>
                <li>Communicate about your reservations</li>
                <li>Send promotional materials (with consent)</li>
                <li>Improve our services and website functionality</li>
                <li>Comply with legal obligations</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </div>
            
            <div class="privacy-section">
              <h3>🤝 Information Sharing</h3>
              <p>We respect your privacy and do not sell your personal information to third parties.</p>
              <ul>
                <li>Trusted service providers who assist our operations</li>
                <li>Legal requirements or to protect our rights</li>
                <li>Business transfers or mergers (with notice)</li>
                <li>Emergency situations for safety purposes</li>
              </ul>
            </div>
            
            <div class="privacy-section">
              <h3>🔒 Data Security</h3>
              <p>We implement comprehensive security measures to protect your personal information.</p>
              <ul>
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication systems</li>
                <li>Staff training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
            </div>
            
            <div class="privacy-section">
              <h3>⚙️ Your Rights</h3>
              <p>You have control over your personal information and how we use it.</p>
              <ul>
                <li>Access and update your personal information</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability and export</li>
                <li>File complaints with relevant authorities</li>
              </ul>
            </div>
          </div>
        `,
        isActive: true
      },
      {
        type: 'rules',
        title: 'House Rules',
        content: `
          <div class="rules-content">
            <h2>House Rules</h2>
            <p class="intro">Guidelines to ensure a comfortable and respectful environment for all residents</p>
            
            <div class="rules-section">
              <h3>Essential Guidelines</h3>
              
              <div class="rule-item">
                <h4>🕙 Quiet Hours</h4>
                <p class="rule-time">10:00 PM - 7:00 AM</p>
                <p>Please keep noise to a minimum during these hours to respect other guests.</p>
              </div>
              
              <div class="rule-item">
                <h4>🔉 Common Areas</h4>
                <p class="rule-time">Keep volume low</p>
                <p>Use headphones in shared spaces and be mindful of others.</p>
              </div>
              
              <div class="rule-item">
                <h4>🚫 Prohibited Items</h4>
                <p class="rule-time">Strictly forbidden</p>
                <p>No smoking, drugs, or alcohol in all areas of the hostel premises.</p>
              </div>
              
              <div class="rule-item">
                <h4>👥 Visitors</h4>
                <p class="rule-time">Register at reception</p>
                <p>All visitors must be registered and accompanied by residents.</p>
              </div>
            </div>
            
            <div class="rules-section">
              <h3>🛡️ Security & Safety</h3>
              <ul>
                <li>Always lock your room and use provided lockers</li>
                <li>Do not share access codes or keys with others</li>
                <li>Report suspicious activities immediately to staff</li>
                <li>Follow fire safety procedures and evacuation routes</li>
                <li>Keep emergency contact numbers accessible</li>
              </ul>
            </div>
            
            <div class="rules-section">
              <h3>❤️ Respect & Community</h3>
              <ul>
                <li>Treat all residents and staff with respect and kindness</li>
                <li>No discrimination, harassment, or bullying tolerated</li>
                <li>Participate in community activities and events</li>
                <li>Help maintain a positive and inclusive environment</li>
                <li>Resolve conflicts peacefully through proper channels</li>
              </ul>
            </div>
            
            <div class="contact-section">
              <h3>Questions About Our Rules?</h3>
              <p>Our friendly staff is always available to help clarify any guidelines or address concerns.</p>
            </div>
          </div>
        `,
        isActive: true
      }
    ];
    
    // Create new content
    for (const content of contentData) {
      await PublicContent.create({
        ...content,
        lastUpdatedBy: superAdmin._id // Use _id instead of id for MongoDB
      });
      console.log(`✅ Created ${content.type} content`);
    }
    
    console.log('🎉 Content seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ FAQ content created with current page data');
    console.log('✅ Terms & Conditions created with current page data');
    console.log('✅ Privacy Policy created with current page data');
    console.log('✅ House Rules created with current page data');
    console.log('\n🎯 Next steps:');
    console.log('1. Update your frontend pages to fetch from API');
    console.log('2. Access dashboard at /management/admin/super/content to edit live');
    
  } catch (error) {
    console.error('❌ Error seeding content:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
}

const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
};

// Run seeder if called directly
if (require.main === module) {
  clearAndSeedCurrentContent()
    .then(() => {
      console.log('🎉 Content seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Content seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { clearAndSeedCurrentContent, closeConnection };