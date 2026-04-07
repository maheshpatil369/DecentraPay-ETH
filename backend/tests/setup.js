// Load env vars for tests
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
// Override DB for tests
process.env.MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/decentrapay_test';
