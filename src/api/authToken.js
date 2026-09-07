// The JWT issued by the backend on login/register. Kept separate from
// AuthContext so src/api/db.js can attach it to write requests without a
// circular import between the two.
const KEY = "omnidesk_it_token";

export function getToken() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {
    // ignore (private browsing / storage disabled)
  }
}
