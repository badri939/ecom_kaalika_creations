// Proxy loader so code running with different project roots can still
// require('.../lib/firebaseAdmin'). This re-exports the implementation
// under ecommerce_project/lib/firebaseAdmin.js
module.exports = require("./ecommerce_project/lib/firebaseAdmin");
