// Proxy so relative imports like '../../../lib/firebaseAdmin' from
// `app/api/...` resolve correctly during different workspace-root inferences.
// Re-exports the centralized initializer from `ecommerce_project/lib/firebaseAdmin.js`.
module.exports = require('../lib/firebaseAdmin');
