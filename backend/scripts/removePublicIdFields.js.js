// scripts/removePublicIdFields.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run({ uri, dryRun = true, collectionsFilter = null }) {
  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB.');

  try {
    const db = client.db();
    const allCols = await db.listCollections().toArray();
    
    const targetCols = collectionsFilter && collectionsFilter.length
      ? allCols.filter(c => collectionsFilter.includes(c.name))
      : allCols;

    let totalCollections = 0;
    let totalDocumentsUpdated = 0;

    for (const collInfo of targetCols) {
      const name = collInfo.name;
      const coll = db.collection(name);

      // First, count documents that have publicId field
      const countWithPublicId = await coll.countDocuments({ publicId: { $exists: true } });
      
      if (countWithPublicId === 0) {
        console.log(`\n📋 Collection: ${name} - No documents with publicId field found`);
        continue;
      }

      console.log(`\n📋 Collection: ${name}`);
      console.log(`  Found ${countWithPublicId} document(s) with publicId field`);

      if (!dryRun) {
        try {
          console.log(`  Removing publicId field from ${countWithPublicId} document(s)...`);
          
          const result = await coll.updateMany(
            { publicId: { $exists: true } },
            { $unset: { publicId: "" } }
          );

          console.log(`  ✅ Updated ${result.modifiedCount} document(s)`);
          totalDocumentsUpdated += result.modifiedCount;
          totalCollections++;

        } catch (err) {
          console.error(`  ❌ Failed to update collection '${name}':`, err.message || err);
        }
      } else {
        console.log(`  🔍 (dry-run) Would remove publicId from ${countWithPublicId} document(s)`);
        totalDocumentsUpdated += countWithPublicId; // For dry-run summary
        totalCollections++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  Collections processed: ${totalCollections}`);
    console.log(`  Documents ${dryRun ? 'that would be updated' : 'updated'}: ${totalDocumentsUpdated}`);
    
    if (dryRun) {
      console.log(`  🔒 Dry-run mode: No actual changes made`);
    } else {
      console.log(`  ✅ All publicId fields have been removed`);
    }

  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed.');
  }
}

// CLI
(async () => {
  const argv = process.argv.slice(2);
  const apply = argv.includes('--apply');
  const uriIndex = argv.findIndex(a => a === '--uri');
  const colsIndex = argv.findIndex(a => a === '--collections');

  const uri = (uriIndex !== -1 && argv[uriIndex + 1]) 
    ? argv[uriIndex + 1] 
    : process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MongoDB URI not provided. Set MONGODB_URI in .env or pass --uri "<uri>"');
    process.exit(1);
  }

  const collections = colsIndex !== -1 && argv[colsIndex + 1]
    ? argv[colsIndex + 1].split(',').map(s => s.trim()).filter(Boolean)
    : null;

  console.log('🚀 Starting publicId field removal script...');
  console.log(`📂 Target collections: ${collections ? collections.join(', ') : 'ALL collections'}`);
  console.log(`🔧 Mode: ${apply ? 'APPLY (will make changes)' : 'DRY-RUN (no changes)'}`);
  console.log('─'.repeat(60));

  try {
    await run({ 
      uri, 
      dryRun: !apply, 
      collectionsFilter: collections 
    });

    console.log('─'.repeat(60));
    if (!apply) {
      console.log('🔍 Dry-run complete. Re-run with --apply to perform the actual removal.');
      console.log('💡 Command: node scripts/removePublicIdFields.js --collections "..." --apply');
    } else {
      console.log('🎉 Field removal complete!');
    }

  } catch (err) {
    console.error('💥 Script error:', err);
    process.exit(2);
  }
})();