import { generateRecoveryLink } from '../tests/runners/authChecks.ts';
const target = process.argv[2] ?? 'https://your-app.example.com/auth/reset-password';
const email = process.argv[3] ?? 'admin@example.com';
const { actionLink } = await generateRecoveryLink(email, target);
console.log(actionLink);
