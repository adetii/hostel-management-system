require('dotenv').config();
const mongoose = require('../config/database');
const {
  Admin,
  AcademicSettings,
  Settings,
  PasswordResetToken,
  PublicContent,
  ContentVersion
} = require('../models');

const MODELS_TO_CLEAN = [
  { Model: Admin, label: 'Admin' },
  { Model: Settings, label: 'Settings' },
  { Model: AcademicSettings, label: 'AcademicSettings' },
  { Model: PublicContent, label: 'PublicContent' },
  { Model: ContentVersion, label: 'ContentVersion' },
  { Model: PasswordResetToken, label: 'PasswordResetToken' },
];

const QUERY_HAS_PUBLIC_ID = {
  publicId: { $exists: true }
};

async function removePublicIdFromModel(Model, label, batchSize = 500) {
  console.log(`\n=== [${label}] Remove publicId start ===`);

  // If the model is not defined, skip gracefully
  if (!Model) {
    console.log(`[${label}] Model not available. Skipping.`);
    return;
  }

  const totalWithPublicId = await Model.countDocuments(QUERY_HAS_PUBLIC_ID);
  if (totalWithPublicId === 0) {
    console.log(`[${label}] No documents with publicId found.`);
    return;
  }

  console.log(`[${label}] Documents with publicId: ${totalWithPublicId}`);

  let processed = 0;
  while (processed < totalWithPublicId) {
    const docs = await Model.find(QUERY_HAS_PUBLIC_ID)
      .limit(batchSize)
      .select('_id publicId');

    if (!docs.length) break;

    const ops = docs.map(d => ({
      updateOne: {
        filter: { _id: d._id },
        update: { $unset: { publicId: "" } }
      }
    }));

    if (ops.length) {
      const res = await Model.bulkWrite(ops, { ordered: false });
      processed += docs.length;
      console.log(
        `[${label}] Removed publicId from batch. Processed: ${processed}/${totalWithPublicId}`,
        res.result || res
      );
    } else {
      break;
    }
  }

  console.log(`=== [${label}] Remove publicId complete ===`);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {});
    console.log('Connected to MongoDB');

    for (const { Model, label } of MODELS_TO_CLEAN) {
      try {
        await removePublicIdFromModel(Model, label);
      } catch (err) {
        console.error(`Error removing publicId from ${label}:`, err);
      }
    }

    console.log('\nAll publicId removals completed');
    await mongoose.connection.close();
    console.log('MongoDB disconnected');
    process.exit(0);
  } catch (err) {
    console.error('Remove publicId error:', err);
    process.exit(1);
  }
})();