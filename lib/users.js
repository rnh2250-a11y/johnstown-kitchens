// Users stored in USERS_JSON env var as: [{"email":"...","password":"..."}]
// The admin user is always ADMIN_EMAIL + ADMIN_PASSWORD (separate env vars).

export function getExtraUsers() {
  try {
    return JSON.parse(process.env.USERS_JSON || '[]');
  } catch { return []; }
}

export function findUser(email) {
  const key = email.toLowerCase().trim();
  return getExtraUsers().find(u => u.email.toLowerCase().trim() === key) || null;
}
