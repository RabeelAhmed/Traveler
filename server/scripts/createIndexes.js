require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.URI);
    for (const file of fs.readdirSync(path.join(__dirname, '../Models')).filter(name => name.endsWith('.js'))) {
      const model = require(path.join(__dirname, '../Models', file));
      await model.createIndexes();
      console.log('Indexes ready:', model.modelName);
    }
  } catch (err) { console.error(err.message); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
})();
