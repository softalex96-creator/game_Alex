let authPromise;

window.ensureLevelUpAuth = () => {
  authPromise ||= import("./firebase-auth.js?v=lazy-auth-1");
  return authPromise;
};
