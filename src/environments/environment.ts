export const environment = {
  production: false,

  firebaseConfig: {
    apiKey: "DIN_FIREBASE_API_KEY",
    authDomain: "DIN_FIREBASE_AUTH_DOMAIN",
    databaseURL: "https://my-game-portal-10af3-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "my-game-portal-10af3",
    storageBucket: "my-game-portal-10af3.appspot.com",
    messagingSenderId: "DIN_FIREBASE_MESSAGING_SENDER_ID",
    appId: "DIN_FIREBASE_APP_ID"
  },

  // ← LOKAL emulator URL (når du kører: firebase emulators:start --only functions)
  cloudinarySignFnUrl: "http://127.0.0.1:5001/my-game-portal-10af3/europe-west1/getCloudinarySignature"
};
