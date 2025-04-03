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
//selin 26-03-2025
export class SettingsComponent implements OnInit {
  isChangePassword = false;
  newPassword = '';
  confirmPassword = '';

  isChangeUsername = false;
  newUsername = '';
  currentUsername: string | null = '';


  isChangeTheme=false;
  backgroundColor = '';
  navbarColor = '';

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        this.currentUsername = user.displayName || 'Not set';
  
        // Retrieve saved theme settings from localStorage
        const savedThemeSettings = localStorage.getItem('themeSettings');
        if (savedThemeSettings) {
          const themeSettings = JSON.parse(savedThemeSettings);
          this.backgroundColor = themeSettings.backgroundColor || '';
          this.navbarColor = themeSettings.navbarColor || '';
  
          // Apply saved theme settings
          document.body.style.backgroundColor = this.backgroundColor;
          document.querySelector('.navbar')?.setAttribute('style', `background-color: ${this.navbarColor}`);
        }
      }
    });
  }
  
  


  optionChangePassword() {
    this.isChangePassword = true;
    this.isChangeUsername = false;
    this.isChangeTheme=false;

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
    this.isChangeTheme=false;

  }

  updateUsername(event: any) {
    this.newUsername = event.target.value;
  }
  submitNewUsername() {
  
    const db = this.firebaseService.getDatabase();
    const usersRef = ref(db, 'users');
  
    // Query Firebase to check if the username exists
    const usernameQuery = query(usersRef, orderByChild('name'), equalTo(this.newUsername));
  
    get(usernameQuery).then(snapshot => {
      if (snapshot.exists()) {
        alert('Username is already taken.');
        return;
      }
  
      // If username is available, update it
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
  saveThemeSettings() {
    const themeSettings = {
      backgroundColor: this.backgroundColor,
      navbarColor: this.navbarColor
    };
  
    // Save theme settings to localStorage
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
  
    // Apply the theme settings immediately
    document.body.style.backgroundColor = this.backgroundColor;
    document.querySelector('.navbar')?.setAttribute('style', `background-color: ${this.navbarColor}`);
    
    alert('Theme updated successfully!');
  }
  
  
  optionChangeTheme() {
    this.isChangePassword = false;
    this.isChangeUsername = false;
    this.isChangeTheme=true;
  }
  updateBackgroundColor(event: any) {
    this.backgroundColor = event.target.value;
    document.body.style.backgroundColor = this.backgroundColor;

  }

  updateNavbarColor(event: any) {
    this.navbarColor = event.target.value;
    document.querySelector('.navbar')?.setAttribute('style', `background-color: ${this.navbarColor}`);

  }
}
