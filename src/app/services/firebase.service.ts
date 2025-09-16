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
import { getDatabase, ref, set, get, update, push, onChildAdded, remove } from 'firebase/database';
import { environment } from '../environments/environment';
import { initializeApp } from 'firebase/app';
import { Message } from '../chat/Message';
import { share } from 'rxjs';
import { sendPasswordResetEmail } from 'firebase/auth';


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
  // User Management Functions / SELIN 16.09
  // ------------------------------
// Create a new user in Firebase Auth + Database
  registerUser(email: string, password: string, displayName: string): Promise<any> {
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
      // Save displayName to Auth profile
        return updateProfile(user, { displayName }).then(() => {

      // Send verification email
          return sendEmailVerification(user).then(() => {
            console.log('Verification email sent.');

      // Check if email belongs to hardcoded admin list
            const isAdmin = FirebaseService.isHardcodedAdmin(email);
      
      // Save user in Realtime Database
            return this.createUser(user.uid, displayName, email, isAdmin)
              .then(() => ({ uid: user.uid, isAdmin }));
          });
        });
      });
  }

  // Write new user data to Realtime Database
  createUser(uid: string, displayName: string, email: string, isAdmin: boolean): Promise<void> {
    return set(ref(database, `users/${uid}`), {
      displayName,
      email,
      isAdmin,
      createdAt: new Date().toISOString()
    });
  }

// Send password reset email
  resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(auth, email)
      .then(() => {
        console.log('Password reset email sent.');
      })
      .catch((error) => {
        console.error('Error sending password reset email:', error);
        throw error;
      });
  }

  // Check if a user is admin
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

  // Give admin rights to a user
  createAdminRights(uid: string): Promise<void> {
    return update(ref(database, `users/${uid}`), { isAdmin: true });
  }

// Remove admin rights from a user
  revokeAdminRights(uid: string): Promise<void> {
    return update(ref(database, `users/${uid}`), { isAdmin: false });
  }

// Delete a user completely from DB
  deleteUser(uid: string): Promise<void> {
    return set(ref(database, `users/${uid}`), null);
  }

  // Update a user’s info (name, email, or admin rights)
  sendUser(uid: string, updates: { displayName?: string; email?: string; isAdmin?: boolean }): Promise<void> {
    return update(ref(database, `users/${uid}`), updates);
  }

  // Login with email + password
  loginUser(email: string, password: string): Promise<any> {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout current user
  logout(): Promise<void> {
    this.clearDisplayName();
    return signOut(auth);
  }

  // Get all users from database (admins + regular)
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
// SELIN 16.09


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
      createdAt: new Date().toISOString(),
      plays: 0 
    });
  }
  incrementPlays(gameId: string): Promise<void> {
    const db = this.getDatabase();
    const gameRef = ref(db, `games/${gameId}`);
  
    return get(gameRef).then(snapshot => {
      if (!snapshot.exists()) throw new Error('Game not found');
  
      const gameData = snapshot.val();
      const currentPlays = typeof gameData.plays === 'number' ? gameData.plays : 0;
  
      return update(gameRef, {
        plays: currentPlays + 1,
        lastPlayedAt: new Date().toISOString()
      });
    });
  }
  async addMissingPlaysField(): Promise<void> {
    try {
      const db = this.getDatabase();
      const gamesRef = ref(db, 'games');
      const snapshot = await get(gamesRef);
  
      if (snapshot.exists()) {
        const data = snapshot.val();
        const updates: Promise<void>[] = [];
  
        for (const gameId in data) {
          const game = data[gameId];
          if (typeof game.plays !== 'number') {
            const gameRef = ref(db, `games/${gameId}`);
            updates.push(update(gameRef, { plays: 0 }));
            console.log(`✅ Tilføjede 'plays: 0' til spillet ${game.title}`);
          }
        }
  
        await Promise.all(updates);
  
        if (updates.length === 0) {
          console.log('Alle spil har allerede feltet "plays".');
        } else {
          console.log(`🎉 Tilføjede 'plays' til ${updates.length} spil.`);
        }
  
      } else {
        console.log('⚠️ Der findes ingen spil i databasen.');
      }
  
    } catch (error) {
      console.error('❌ Fejl ved tilføjelse af "plays"-felter:', error);
    }
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

  //SELIN 16.09
// Create a new settings entry for a user
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

// Save theme colors directly under the user’s node
  saveThemeSettings(uid: string, settings: { backgroundColor: string; navbarColor: string }) {
    
    // Apply theme immediately on the page
    document.body.style.backgroundColor = settings.backgroundColor;
    document.querySelector('.navbar')?.setAttribute('style', `background-color: ${settings.navbarColor}`);

    // Save to Firebase under users/uid/theme
    return set(ref(database, `users/${uid}/theme`), settings);
  }

// Update an existing settings entry
  updateSettings(
    settingsId: string,
    updates: { navbarColor?: string; navbarFontColor?: string; backgroundColor?: string }
  ): Promise<void> {
    return update(ref(database, `settings/${settingsId}`), updates);
  }
//SELIN 16.09


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

  // Update the current user's password
  updateUserPassword(uid: string, newPassword: string): Promise<void> {
    const authInstance = this.getAuth();
    const user = authInstance.currentUser;
     
    // Only allow if the logged-in user matches the given uid
    if (user && user.uid === uid) {
      return updatePassword(user, newPassword); // Firebase Auth update
    } else {
      return Promise.reject('User not authenticated'); // reject if no match
    }
  }

  // Update the current user's username (displayName)
  updateUsername(uid: string, newUsername: string): Promise<void> {
    const authInstance = this.getAuth();
    const user = authInstance.currentUser;

  // Only allow if the logged-in user matches the given uid
    if (user && user.uid === uid) {
      // also update in Realtime Database
      return updateProfile(user, { displayName: newUsername })  // update in Firebase Auth
        .then(() => {
          return update(ref(database, `users/${uid}`), { name: newUsername });
        })
        .then(() => user.reload()) // reload user to apply changes
        .then(() => {
          console.log('Updated username:', newUsername);
        })
        .catch(error => Promise.reject(error));
    } else {
      return Promise.reject('User not authenticated');
    }
  }
//SELIN 16.09
  // ------------------------------
  // NY Highscore Metode
  // ------------------------------
  // Denne metode opretter en ny highscore-post med displayName, gameTitle og score.
  submitHighscore(displayName: string, email: string, gameTitle: string, score: number, games_Id: string): Promise<void> {
    const highscoresRef = ref(database, 'highscores/');
  
    return get(highscoresRef).then(snapshot => {
      const allHighscores = snapshot.val();
  
      let existingKey: string | null = null;
      let existingScore: number = 0;
  
      if (allHighscores) {
        for (const key in allHighscores) {
          const entry = allHighscores[key];
          if (entry.displayName === displayName && entry.games_Id === games_Id) {
            existingKey = key;
            existingScore = entry.score;
            break;
          }
        }
      }
  
      if (existingKey) {
        if (score > existingScore) {
          console.log("⬆️ Ny score er højere – opdaterer.");
        console.log("Sender highscore:", { displayName, email, gameTitle, score, games_Id });

          return update(ref(database, `highscores/${existingKey}`), {
            score: score,
            email: email,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log("⬇️ Ny score er lavere – ignorerer.");
          return Promise.resolve();
        }
      } else {
        console.log("🆕 Ingen tidligere score – opretter ny.");
        console.log("Sender highscore:", { displayName, email, gameTitle, score, games_Id });

        const newKey = Date.now();
        return set(ref(database, `highscores/${newKey}`), {
          displayName: displayName,
          email: email,
          gameTitle: gameTitle,
          score: score,
          games_Id: games_Id,
          timestamp: new Date().toISOString()
          
        });
      }
    });
  }
  
  
  
  getHighscoresForGame(gameId: string): Promise<any[]> {
    const highscoresRef = ref(this.getDatabase(), 'highscores/');
    return get(highscoresRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const filtered = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(score => score.games_Id === gameId);
  
        return filtered;
      }
      return [];
    });
  }





  // Alexander 01-04-2025
  //  ------------------------------
  //  #region  Chat Functions 
  //  ------------------------------
  
  
  sendMessage( message: Message): Promise<void> {
    const chatref = ref(database, `messages/`);

    return push(chatref, {
      text: message.text,
      userName: message.userName,
      timeStamp: message.timeStamp.toISOString(),
      gameId: message.gameId,
    }).then(() => {});
  }


  listenForMessages(callback: (message: Message) => void): void {
    const chatref = ref(database, `messages/`);
    
    onChildAdded(chatref, (snapshot) => {
      callback(snapshot.val());
    });
  }

  async cleanOldMessages() {
    const chatref = ref(database, `messages/`);

    try {
      const snapshot = await get(chatref);
      if (snapshot.exists()) {
        const messages = snapshot.val();
        const n = Date.now();

        Object.keys(messages).forEach(async (messageId) => {
          const message = messages[messageId];
          const messageTime = new Date(message.timeStamp).getTime();

          if (n - messageTime > 3600000) {
            await remove(ref(database, `messages/${messageId}`));
          }
        });
      }
    } catch (error) {
      console.error("Error cleaning messages:", error);
    }
  }

  //#endregion
  // Alexander 01-04-2025
updateGame(gameId: string, updates: { title?: string; description?: string; netlifyUrl?: string; imageUrl?: string }): Promise<void>
 {
    return update(ref(this.getDatabase(), `games/${gameId}`), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }








  //image-Uploader

saveImageMetadata(name: string, url: string): Promise<void> {
  const db = this.getDatabase();
  const id = Date.now().toString();
  return set(ref(db, `uploadedImages/${id}`), {
    name,
    url,
    createdAt: new Date().toISOString()
  });
}

getImagesByName(searchTerm: string): Promise<{ id: string; name: string; url: string }[]> {
  const db = this.getDatabase();
  const imagesRef = ref(db, 'uploadedImages');

  return get(imagesRef).then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.entries(data)
        .map(([id, item]: [string, any]) => ({
          id,
          name: item.name,
          url: item.url
        }))
        .filter((img) =>
          img.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    return [];
  });
}



deleteImageMetadata(id: string): Promise<void> {
  const db = this.getDatabase();
  return set(ref(db, `uploadedImages/${id}`), null);
}


}