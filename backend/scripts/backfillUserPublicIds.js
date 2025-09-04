require('dotenv').config();
const mongoose = require('../config/database');
const { User } = require('../models');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {});
    console.log('Connected to MongoDB');

    const query = { $or: [{ publicId: { $exists: false } }, { publicId: null }, { publicId: '' }] };
    const totalMissing = await User.countDocuments(query);
    console.log(`Students missing publicId: ${totalMissing}`);

    const batchSize = 500;
    let processed = 0;

    while (processed < totalMissing) {
      const users = await User.find(query).limit(batchSize).select('_id publicId');
      if (!users.length) break;

      const ops = users.map(u => ({
        updateOne: {
          filter: { _id: u._id },
          update: { $set: { publicId: uuidv4() } }
        }
      }));

      if (ops.length) {
        const res = await User.bulkWrite(ops, { ordered: false });
        processed += users.length;
        console.log(`Updated batch. Processed: ${processed}/${totalMissing}`, res.result || res);
      } else {
        break;
      }
    }

    console.log('Backfill complete');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Backfill error:', err);
    process.exit(1);
  }
})();