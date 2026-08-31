const firebaseAccountsEndpoint = "https://identitytoolkit.googleapis.com/v1/accounts:lookup";

export async function verifyFirebaseIdToken(idToken, fetchImpl = fetch) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new Error("Firebase verification is not configured");
  if (!idToken || idToken.length > 4096) throw new Error("Invalid Firebase token");

  const response = await fetchImpl(`${firebaseAccountsEndpoint}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const payload = await response.json().catch(() => ({}));
  const user = payload.users?.[0];
  if (!response.ok || !user?.localId || !user?.email || user.emailVerified !== true) throw new Error("Firebase user is not verified");
  return { uid: user.localId, email: user.email, displayName: user.displayName || "Игрок LevelUp" };
}

export async function authenticateFirebaseRequest(request, fetchImpl = fetch) {
  const authorization = String(request.headers.authorization || "");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error("Authorization is required");
  return verifyFirebaseIdToken(match[1], fetchImpl);
}
