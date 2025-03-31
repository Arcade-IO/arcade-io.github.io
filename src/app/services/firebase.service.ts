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
  sendEmailVerification
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
  public currentDisplayName: string = '';

  constructor() {
    this.listenToAuthStateChanges();
    this.loadCurrentUser();
  }

  // Get the Firebase Database instance
  getDatabase() {
    return database;
  }

  // Get the Firebase Auth instance
  getAuth() {
    return auth;
  }

  private loadCurrentUser(): void {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
      } else {
        this.currentUser = null;
      }
    });
  }

  // ------------------------------
  // User Management Functions
  // ------------------------------

  registerUser(email: string, password: string, displayName: string): Promise<any> {
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        return updateProfile(user, { displayName }).then(() => {
          return sendEmailVerification(user).then(() => {
            console.log('Verification email sent.');
            const isAdmin = FirebaseService.isHardcodedAdmin(email);
            return this.createUser(user.uid, displayName, email, isAdmin)
              .then(() => ({ uid: user.uid, isAdmin }));
          });
        });
      });
  }

  createUser(uid: string, displayName: string, email: string, isAdmin: boolean): Promise<void> {
    return set(ref(database, `users/${uid}`), {
      displayName,
      email,
      isAdmin,
      createdAt: new Date().toISOString()
    });
  }

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

  createAdminRights(uid: string): Promise<void> {
    return update(ref(database, `users/${uid}`), { isAdmin: true });
  }

  revokeAdminRights(uid: string): Promise<void> {
    return update(ref(database, `users/${uid}`), { isAdmin: false });
  }

  deleteUser(uid: string): Promise<void> {
    return set(ref(database, `users/${uid}`), null);
  }

  sendUser(uid: string, updates: { displayName?: string; email?: string; isAdmin?: boolean }): Promise<void> {
    return update(ref(database, `users/${uid}`), updates);
  }

  loginUser(email: string, password: string): Promise<any> {
    return signInWithEmailAndPassword(auth, email, password);
  }

  logout(): Promise<void> {
    this.clearDisplayName();
    return signOut(auth);
  }

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

  // ------------------------------
  // Game, Forum, and Settings Management
  // ------------------------------

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

  deleteGame(gameId: string): Promise<void> {
    return set(ref(database, `games/${gameId}`), null);
  }

  createForumPost(
    forumId: string,
    gameId: string,
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

  saveThemeSettings(uid: string, settings: { backgroundColor: string; navbarColor: string }) {
    document.body.style.backgroundColor = settings.backgroundColor;
    document.querySelector('.navbar')?.setAttribute('style', `background-color: ${settings.navbarColor}`);
    return set(ref(database, `users/${uid}/theme`), settings);
  }

  updateSettings(
    settingsId: string,
    updates: { navbarColor?: string; navbarFontColor?: string; backgroundColor?: string }
  ): Promise<void> {
    return update(ref(database, `settings/${settingsId}`), updates);
  }

  // ------------------------------
  // Auth State & Utility Functions
  // ------------------------------

  private listenToAuthStateChanges(): void {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user ? user : null;
    });
  }

  getAuthStateListener(callback: (user: any) => void): void {
    onAuthStateChanged(auth, callback);
  }

  getCurrentUser(): any {
    return this.currentUser;
  }

  private static isHardcodedAdmin(email: string): boolean {
    const adminEmails = ['selin@selin.dk'];
    return adminEmails.includes(email);
  }

  // ------------------------------
  // DisplayName Management
  // ------------------------------

  updateDisplayName(uid: string): Promise<void> {
    return this.getUserbyUID(uid)
      .then((userData) => {
        if (userData && userData.displayName) {
          this.currentDisplayName = userData.displayName;
        } else {
          this.currentDisplayName = '';
        }
      })
      .catch((error) => {
        console.error('Error updating displayName:', error);
        this.currentDisplayName = '';
      });
  }

  clearDisplayName(): void {
    this.currentDisplayName = '';
  }

  // Henter brugerdata baseret på uid
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

  updateUserPassword(uid: string, newPassword: string): Promise<void> {
    const authInstance = this.getAuth();
    const user = authInstance.currentUser;
    
    if (user && user.uid === uid) {
      return updatePassword(user, newPassword);
    } else {
      return Promise.reject('User not authenticated');
    }
  }

  updateUsername(uid: string, newUsername: string): Promise<void> {
    const authInstance = this.getAuth();
    const user = authInstance.currentUser;
  
    if (user && user.uid === uid) {
      return updateProfile(user, { displayName: newUsername })
        .then(() => {
          return update(ref(database, `users/${uid}`), { name: newUsername });
        })
        .then(() => user.reload())
        .then(() => {
          console.log('Updated username:', newUsername);
        })
        .catch(error => Promise.reject(error));
    } else {
      return Promise.reject('User not authenticated');
    }
  }

  // ------------------------------
  // NY Highscore Metode
  // ------------------------------
  // Denne metode opretter en ny highscore-post med displayName, gameTitle og score.
  submitHighscore(displayName: string, gameTitle: string, score: number): Promise<void> {
    const newHighscoreRef = ref(database, 'highscores/' + Date.now());
    return set(newHighscoreRef, {
      displayName: displayName,
      gameTitle: gameTitle,
      score: score,
      timestamp: new Date().toISOString()
    });
  }
}
