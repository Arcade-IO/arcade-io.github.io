export const environment = {
  production: false,

  firebaseConfig: {
    apiKey: "AIzaSyAQXh6D3CSZJYDVM57ZeHfJZShIQQX4LG0",
    authDomain: "my-game-portal-10af3.firebaseapp.com",
    databaseURL: "https://my-game-portal-10af3-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "my-game-portal-10af3",
    storageBucket: "my-game-portal-10af3.appspot.com",
    messagingSenderId: "DIN_FIREBASE_MESSAGING_SENDER_ID",
    appId: "DIN_FIREBASE_APP_ID"
  },

  // ← LOKAL emulator URL (når du kører: firebase emulators:start --only functions)
  cloudinarySignFnUrl: "http://127.0.0.1:5001/my-game-portal-10af3/europe-west1/getCloudinarySignature"
};
