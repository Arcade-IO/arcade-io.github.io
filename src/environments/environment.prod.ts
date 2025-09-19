export const environment = {
  production: true,

  firebaseConfig: {
    apiKey: "AIzaSyAQXh6D3CSZJYDVM57ZeHfJZShIQQX4LG0",
    authDomain: "my-game-portal-10af3.firebaseapp.com",
    databaseURL: "https://my-game-portal-10af3-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "my-game-portal-10af3",
    storageBucket: "my-game-portal-10af3.appspot.com",
    messagingSenderId: "DIN_FIREBASE_MESSAGING_SENDER_ID",
    appId: "DIN_FIREBASE_APP_ID"
  },

  // ← DEPLOYEDET cloud function URL
  cloudinarySignFnUrl: "https://europe-west1-my-game-portal-10af3.cloudfunctions.net/getCloudinarySignature"
};
