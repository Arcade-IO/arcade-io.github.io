import { Injectable } from '@angular/core';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  updatePassword,
  updateProfile,
  updateEmail as firebaseUpdateEmail // Added new import alias for updateEmail
} from 'firebase/auth';
import { getDatabase, ref, set, get, update } from 'firebase/database';
import { environment } from '../environments/environment';
import { initializeApp } from 'firebase/app';


// Initialize Firebase
const app = initializeApp(environment.firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Set Firebase authentication persistence to LOCAL
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence set to LOCAL");
    
  })
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  currentUser: any = null;

  constructor() {
    this.listenToAuthStateChanges();
    this.loadCurrentUser();
  }

  //hazel 24-03-2025 13.55
  // Get the Firebase Database instance
  getDatabase() {
    return database;
  }
  //hazel 24-03-2025 13.55

  //hazel 25-03-2025 14.25
  // Get the Firebase Auth instance
  getAuth() {
    return auth;
  }

  private loadCurrentUser(): void {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
        console.log("User data loaded:", user);
      } else {
        console.warn("No user data found!");
        this.currentUser = null;
      }
    });
  }
  
  //hazel 25-03-2025 14.25

  //hazel 24-03-2025 13.55
  async createOrUpdateHighscore(userId: string, gameId: string, score: number): Promise<void> {
    const highscoreId = `${userId}_${gameId}`;  // Construct the highscoreId from userId and gameId
    const highscoreRef = ref(database, `highscores/${highscoreId}`);
    
    // Fetch the current high score (if any)
    const snapshot = await get(highscoreRef);
    
    if (snapshot.exists()) {
      // If high score exists, check if the new score is higher
      const currentHighscore = snapshot.val();
      
      if (score > currentHighscore.score) {
        // Update the high score with the new score if it's higher
        await set(highscoreRef, {
          users_Id: userId,
          games_Id: gameId,
          score,
          createdAt: new Date().toISOString()
        });
        console.log("High score updated!");
      } else {
        console.log("Current score is not higher than the existing high score.");
      }
    } else {
      // If no high score exists for this user and game, create a new high score entry
      await set(highscoreRef, {
        users_Id: userId,
        games_Id: gameId,
        score,
        createdAt: new Date().toISOString()
      });
      console.log("New high score created!");
    }
  }
  //hazel 24-03-2025 13.55

  //hazel 26-03-2025 
  // Get user by UID
  getUserbyUID(uid: string): Promise<any> {
    const userRef = ref(database, 'users/' + uid);
    return get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        throw new Error('User not found');
      }
    }).catch((error) => {
      console.error('Error fetching user data:', error);
      throw error;
    });
  }
  //hazel 26-03-2025 

  // ===============================
  // User Management Functions
  // ===============================

  // Create user
  registerUser(
    email: string,
    password: string,
    displayName: string
  ): Promise<any> {
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        // Firebase Auth'taki displayName'i güncelle
        return updateProfile(user, { displayName }).then(() => {
          const isAdmin = FirebaseService.isHardcodedAdmin(email);
          return this.createUser(user.uid, displayName, email, isAdmin)
            .then(() => ({ uid: user.uid, isAdmin }));
        });
      });
  }

  // Create user in the database
  createUser(
    uid: string,
    displayName: string,
    email: string,
    isAdmin: boolean
  ): Promise<void> {
    return set(ref(database, `users/${uid}`), {
      displayName,
      email,
      isAdmin,
      createdAt: new Date().toISOString()
    });
  }

  // Check if user is an admin
  checkIfAdmin(uid: string): Promise<boolean> {
    const userRef = ref(database, `users/${uid}`);
    return get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        return userData.isAdmin || false;
      }
      return false;
    }).catch((error) => {
      console.error('Error checking admin status:', error);
      return false;
    });
  }

  // Grant admin rights to a user
  createAdminRights(uid: string): Promise<void> {
    return update(ref(database, `users/${uid}`), { isAdmin: true });
  }

  // Revoke admin rights from a user
  revokeAdminRights(uid: string): Promise<void> {
    return update(ref(database, `users/${uid}`), { isAdmin: false });
  }

  // Delete user
  deleteUser(uid: string): Promise<void> {
    return set(ref(database, `users/${uid}`), null);
  }

  // Update user information
  sendUser(
    uid: string,
    updates: { displayName?: string; email?: string; isAdmin?: boolean }
  ): Promise<void> {
    return update(ref(database, `users/${uid}`), updates);
  }

  // Log in user
  loginUser(email: string, password: string): Promise<any> {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Log out user
  logout(): Promise<void> {
    return signOut(auth);
  }

  // Get all users
  getAllUsers(): Promise<any[]> {
    const usersRef = ref(database, 'users/');
    return get(usersRef).then((snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        return Object.keys(usersData).map(uid => ({ uid, ...usersData[uid] }));
      }
      return [];
    });
  }

  // ================================
  // Game, Highscore, and Forum Management
  // ================================

  // Create a game
  createGame(
    gameId: string,
    title: string,
    description: string,
    imageUrl: string,
    netlifyUrl: string,
    platform: string,
    userId: string
  ): Promise<void> {
    return set(ref(database, `games/${gameId}`), {
      title,
      description,
      imageUrl,
      netlifyUrl,
      platform,
      users_Id: userId,
      createdAt: new Date().toISOString()
    });
  }

  // Create a highscore
  createHighscore(
    highscoreId: string,
    userId: string,
    gameId: string,
    score: number
  ): Promise<void> {
    return set(ref(database, `highscores/${highscoreId}`), {
      users_Id: userId,
      games_Id: gameId,
      score,
      createdAt: new Date().toISOString()
    });
  }

  // Create a forum post
  createForumPost(
    forumId: string,
    gameId: string,  // If the post is game-specific
    userId: string,
    message: string
  ): Promise<void> {
    return set(ref(database, `forums/${forumId}`), {
      games_Id: gameId,
      users_Id: userId,
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Create settings
  createSettings(
    settingsId: string,
    userId: string,
    navbarColor: string,
    navbarFontColor: string,
    backgroundColor: string
  ): Promise<void> {
    return set(ref(database, `settings/${settingsId}`), {
      users_Id: userId,
      navbarColor,
      navbarFontColor,
      backgroundColor
    });
  }

  // Update settings
  updateSettings(
    settingsId: string,
    updates: { navbarColor?: string; navbarFontColor?: string; backgroundColor?: string }
  ): Promise<void> {
    return update(ref(database, `settings/${settingsId}`), updates);
  }

  // Listen to authentication state changes
  private listenToAuthStateChanges(): void {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user ? user : null;
    });
  }

  // Expose a listener for auth state changes so components can subscribe
  getAuthStateListener(callback: (user: any) => void): void {
    onAuthStateChanged(auth, callback);
  }

  // Get the current logged-in user
  getCurrentUser(): any {
    return this.currentUser;
  }

  // Hardcoded admin check
  private static isHardcodedAdmin(email: string): boolean {
    const adminEmails = ['selin@selin.dk'];
    return adminEmails.includes(email);
  }

  // Funktion til at hente highscores for et bestemt spil
  async getHighscoresForGame(gameId: string): Promise<any[]> {
    const highscoresRef = ref(database, `highscores/`);
    const snapshot = await get(highscoresRef);
    let highscores: any[] = [];

    if (snapshot.exists()) {
      const highscoresData = snapshot.val();
      
      // Filtrér highscores for det valgte spil
      for (let highscoreId in highscoresData) {
        if (highscoresData[highscoreId].games_Id === gameId) {
          highscores.push({
            username: highscoresData[highscoreId].users_Id,
            gameTitle: highscoresData[highscoreId].score,
            score: highscoresData[highscoreId].score,
          });
        }
      }
    } else {
      // Hvis ingen data, opret en tom node
      await set(ref(database, `highscores/`), { message: 'No data found yet.' });
      console.log("Oprettede en ny node for highscores.");
    }

    return highscores;
  }

  // 25.03.2025 / Selin
  updateUserPassword(uid: string, newPassword: string): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user && user.uid === uid) {
      return updatePassword(user, newPassword);
    } else {
      return Promise.reject('User not authenticated');
    }
  }
  // 25.03.2025 / Selin

  // 26.03.2025 / Selin
  //updates username in settings
  updateUsername(uid: string, newUsername: string): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;
  
    if (user && user.uid === uid) {
      return updateProfile(user, { displayName: newUsername }) // Updates Firebase Auth
        .then(() => {
          // Update "name" in Realtime Database
          return update(ref(database, `users/${uid}`), { name: newUsername });
        })
        .then(() => user.reload()) // Reloads user data
        .then(() => {
          console.log('Updated username:', newUsername); // Debugging log
        })
        .catch(error => Promise.reject(error));
    } else {
      return Promise.reject('User not authenticated');
    }
  }

  //updates email in settings
  updateEmail(newEmail: string): Promise<void> {
    const user = getAuth().currentUser;
    if (user) {
      // Original code using updateProfile (not valid for email update):
      // return updateProfile(user, { email: newEmail })
      //   .then(() => {
      //     // Update the email in the database
      //     return update(ref(database, `users/${user.uid}`), { email: newEmail });
      //   })
      //   .then(() => user.reload()) // Reload the user data
      //   .then(() => {
      //     console.log('Email updated:', newEmail);
      //   })
      //   .catch(error => Promise.reject(error));

      // Corrected code using firebaseUpdateEmail from firebase/auth:
      return firebaseUpdateEmail(user, newEmail)
        .then(() => {
          // Update the email in the database
          return update(ref(database, `users/${user.uid}`), { email: newEmail });
        })
        .then(() => user.reload()) // Reload the user data
        .then(() => {
          console.log('Email updated:', newEmail);
        })
        .catch(error => Promise.reject(error));
    } else {
      return Promise.reject('User not authenticated');
    }
  }
  // 26.03.2025 / Selin
}
