import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { updateProfile } from 'firebase/auth';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  imports: [CommonModule]
})
// selin 26-03-2025
export class SettingsComponent implements OnInit {
  isChangePassword = false;
  newPassword = '';
  confirmPassword = '';

  isChangeUsername = false;
  newUsername = '';
  currentUsername: string | null = '';

  isChangeTheme = false;
  backgroundColor = '';
  navbarColor = '';

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        this.currentUsername = user.displayName || 'Not set';

        // ✅ Hent theme direkte fra Firebase
        try {
          const userData = await this.firebaseService.getUserbyUID(user.uid);
          const theme = userData?.theme;
          if (theme?.backgroundColor) {
            this.backgroundColor = theme.backgroundColor;
            document.body.style.backgroundColor = this.backgroundColor;
          }
          if (theme?.navbarColor) {
            this.navbarColor = theme.navbarColor;
            document.querySelector('.sidebar')?.setAttribute('style', `background-color: ${this.navbarColor}`);
          }
        } catch (err) {
          console.error('Fejl ved hentning af theme:', err);
        }

        // Vis tema-sektionen som standard
        this.optionChangeTheme();
      }
    });
  }

  optionChangePassword() {
    this.isChangePassword = true;
    this.isChangeUsername = false;
    this.isChangeTheme = false;
  }

  updatePassword(event: any) {
    this.newPassword = event.target.value;
  }

  updateConfirmPassword(event: any) {
    this.confirmPassword = event.target.value;
  }

  submitNewPassword() {
    if (this.newPassword === this.confirmPassword) {
      const user = this.firebaseService.getCurrentUser();
      if (user) {
        this.firebaseService.updateUserPassword(user.uid, this.newPassword)
          .then(() => alert('Password updated successfully'))
          .catch(error => console.error('Error updating password:', error));
      }
    } else {
      console.log('Passwords do not match');
    }
  }

  optionChangeUsername() {
    this.isChangeUsername = true;
    this.isChangePassword = false;
    this.isChangeTheme = false;
  }

  updateUsername(event: any) {
    this.newUsername = event.target.value;
  }

  submitNewUsername() {
    const db = this.firebaseService.getDatabase();
    const usersRef = ref(db, 'users');
    const usernameQuery = query(usersRef, orderByChild('name'), equalTo(this.newUsername));

    get(usernameQuery).then(snapshot => {
      if (snapshot.exists()) {
        alert('Username is already taken.');
        return;
      }

      const user = this.firebaseService.getCurrentUser();
      if (user) {
        this.firebaseService.updateUsername(user.uid, this.newUsername)
          .then(() => updateProfile(user, { displayName: this.newUsername }))
          .then(() => {
            alert('Username updated successfully!');
            this.currentUsername = this.newUsername;
          })
          .catch(error => console.error('Error updating username:', error));
      }
    }).catch(error => console.error('Error checking username:', error));
  }

  optionChangeTheme() {
    this.isChangePassword = false;
    this.isChangeUsername = false;
    this.isChangeTheme = true;
  }

  updateBackgroundColor(event: any) {
    this.backgroundColor = event.target.value;
    document.body.style.backgroundColor = this.backgroundColor;
  }

  updateNavbarColor(event: any) {
    this.navbarColor = event.target.value;
    document.querySelector('.sidebar')?.setAttribute('style', `background-color: ${this.navbarColor}`);
  }

  saveThemeSettings() {
    const user = this.firebaseService.getCurrentUser();
    if (!user) return;
  
    const themeSettings = {
      backgroundColor: this.backgroundColor,
      navbarColor: this.navbarColor
    };
  
    this.firebaseService.saveThemeSettings(user.uid, themeSettings)
      .then(() => {
        localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
  
        document.body.style.backgroundColor = this.backgroundColor;
        document.querySelector('.sidebar')?.setAttribute('style', `background-color: ${this.navbarColor}`);
  
        alert('Theme updated successfully!');
        location.reload(); // 👈 dette refresher hele appen
      })
      .catch(err => console.error('❌ Error saving theme to Firebase:', err));
  }
  
}
