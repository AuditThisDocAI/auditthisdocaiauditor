const fs = require('fs');
let code = fs.readFileSync('src/components/Auth.tsx', 'utf8');

const target1 = `setAuthError('Access Denied: Unauthorized email address. Only authorized administrators are allowed.');`;
const replace1 = `setAuthError('Access Denied: Unauthorized email address. Only brigittalombard09@gmail.com is allowed.');`;
code = code.replace(target1, replace1);

const target2 = `setAuthError('Access Denied: Unauthorized Google account. Only authorized administrators are allowed.');`;
const replace2 = `setAuthError('Access Denied: Unauthorized Google account. Only brigittalombard09@gmail.com is allowed.');`;
code = code.replace(target2, replace2);

fs.writeFileSync('src/components/Auth.tsx', code);
