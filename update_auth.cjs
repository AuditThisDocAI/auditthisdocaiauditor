const fs = require('fs');
let code = fs.readFileSync('src/components/Auth.tsx', 'utf8');

// For handleAuth:
// Find: const isSuperAdmin = isSuperAdminEmail(cleanEmail);
// Replace with:
// const isSuperAdmin = isSuperAdminEmail(cleanEmail);
// if (!isSuperAdmin) {
//   setAuthError('Access Denied: Unauthorized email address. Only Brigittalombard09@gmail.com is allowed.');
//   return;
// }

const target1 = `const isSuperAdmin = isSuperAdminEmail(cleanEmail);`;
const replace1 = `const isSuperAdmin = isSuperAdminEmail(cleanEmail);\n      if (!isSuperAdmin) {\n        setAuthError('Access Denied: Unauthorized email address. Only authorized administrators are allowed.');\n        return;\n      }`;
code = code.replace(target1, replace1);

// For handleGoogleAuth:
// Find: const isSuperAdmin = isSuperAdminEmail(userEmailStr);
// Replace with:
// const isSuperAdmin = isSuperAdminEmail(userEmailStr);
// if (!isSuperAdmin) {
//   setAuthError('Access Denied: Unauthorized Google account.');
//   return;
// }

const target2 = `const isSuperAdmin = isSuperAdminEmail(userEmailStr);`;
const replace2 = `const isSuperAdmin = isSuperAdminEmail(userEmailStr);\n      if (!isSuperAdmin) {\n        setAuthError('Access Denied: Unauthorized Google account. Only authorized administrators are allowed.');\n        return;\n      }`;
code = code.replace(target2, replace2);

fs.writeFileSync('src/components/Auth.tsx', code);
