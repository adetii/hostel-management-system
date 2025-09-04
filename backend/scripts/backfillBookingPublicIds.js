require('dotenv').config();
const mongoose = require('mongoose');
const { Booking } = require('../models');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {});
    console.log('Connected to MongoDB');

    const query = { $or: [{ publicId: { $exists: false } }, { publicId: null }, { publicId: '' }] };
    const totalMissing = await Booking.countDocuments(query);
    console.log(`Bookings missing publicId: ${totalMissing}`);

    const batchSize = 500;
    let processed = 0;

    while (processed < totalMissing) {
      const items = await Booking.find(query).limit(batchSize).select('_id publicId');
      if (!items.length) break;

      const ops = items.map(d => ({
        updateOne: {
          filter: { _id: d._id },
          update: { $set: { publicId: uuidv4() } }
        }
      }));

      if (ops.length) {
        const res = await Booking.bulkWrite(ops, { ordered: false });
        processed += items.length;
        console.log(
          `Updated batch. Processed: ${processed}/${totalMissing}`,
          res.result || res
        );
      } else {
        break;
      }
    }

    console.log('Booking publicId backfill complete');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Backfill error:', err);
    process.exit(1);
  }
})();