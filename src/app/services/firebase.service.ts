import { Injectable } from '@angular/core';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence
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
  }

  // ===============================
  // User Management Functions
  // ===============================

  // Create user
  registerUser(
    email: string,
    password: string,
    name: string
  ): Promise<any> {
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const isAdmin = FirebaseService.isHardcodedAdmin(email);
        return this.createUser(user.uid, name, email, isAdmin)
          .then(() => ({ uid: user.uid, isAdmin }));
      });
  }

  // Create user in the database
  createUser(
    uid: string,
    name: string,
    email: string,
    isAdmin: boolean
  ): Promise<void> {
    return set(ref(database, `users/${uid}`), {
      name,
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
  updateUser(
    uid: string,
    updates: { name?: string; email?: string; isAdmin?: boolean }
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
}
