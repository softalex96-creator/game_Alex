let authPromise;

window.ensureLevelUpAuth = () => {
  authPromise ||= import("./firebase-auth.js?v=mobile-google-4");
  return authPromise;
};
