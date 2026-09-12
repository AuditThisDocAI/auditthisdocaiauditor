const fs = require('fs');
let code = fs.readFileSync('src/components/Auth.tsx', 'utf8');

// Remove the email block
const targetEmailBlock = `      const isSuperAdmin = isSuperAdminEmail(cleanEmail);
      if (!isSuperAdmin) {
        setAuthError('Access Denied: Unauthorized email address. Only brigittalombard09@gmail.com is allowed.');
        return;
      }`;
const replaceEmailBlock = `      const isSuperAdmin = isSuperAdminEmail(cleanEmail);`;
code = code.replace(targetEmailBlock, replaceEmailBlock);

// Remove the Google block
const targetGoogleBlock = `      const isSuperAdmin = isSuperAdminEmail(userEmailStr);
      if (!isSuperAdmin) {
        setAuthError('Access Denied: Unauthorized Google account. Only brigittalombard09@gmail.com is allowed.');
        return;
      }`;
const replaceGoogleBlock = `      const isSuperAdmin = isSuperAdminEmail(userEmailStr);`;
code = code.replace(targetGoogleBlock, replaceGoogleBlock);

fs.writeFileSync('src/components/Auth.tsx', code);
