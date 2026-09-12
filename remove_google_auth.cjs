const fs = require('fs');
let code = fs.readFileSync('src/components/Auth.tsx', 'utf8');

// The button has text "Sign In with Google" or "Instant Sign Up with Google".
// It is between:
// <p className="text-center text-[#64748B] text-sm mb-6">
// ...
// </p>
// AND
// <div className="relative my-5">

// We can just use a regex to replace that entire button block.
const regex = /<button[^>]*handleGoogleAuth[\s\S]*?<\/button>\s*<div className="relative my-5">[\s\S]*?<\/div>\s*<\/div>/g;

// Let's first inspect where handleGoogleAuth is attached to the button.
