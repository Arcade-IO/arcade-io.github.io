export const environment = {
  production: true,

  firebaseConfig: {
    apiKey: "DIN_FIREBASE_API_KEY",
    authDomain: "DIN_FIREBASE_AUTH_DOMAIN",
    databaseURL: "https://my-game-portal-10af3-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "my-game-portal-10af3",
    storageBucket: "my-game-portal-10af3.appspot.com",
    messagingSenderId: "DIN_FIREBASE_MESSAGING_SENDER_ID",
    appId: "DIN_FIREBASE_APP_ID"
  },

  // ← DEPLOYEDET cloud function URL
  cloudinarySignFnUrl: "https://europe-west1-my-game-portal-10af3.cloudfunctions.net/getCloudinarySignature"
};
