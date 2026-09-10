let authPromise;

window.ensureLevelUpAuth = () => {
  authPromise ||= import("./firebase-auth.js?v=mobile-google-3");
  return authPromise;
};
