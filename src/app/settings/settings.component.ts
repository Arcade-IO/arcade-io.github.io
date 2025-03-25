import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  imports: [CommonModule]
})
export class SettingsComponent implements OnInit {
  isChangePassword = false;
  newPassword = '';
  confirmPassword = '';

  isChangeUsername = false;
  newUsername = '';
  currentUsername: string | null = '';

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.currentUsername = user.displayName;
      }
    });
  }

  showChangePassword() {
    this.isChangePassword = true;
    this.isChangeUsername = false;
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
          .then(() => console.log('Password updated successfully'))
          .catch(error => console.error('Error updating password:', error));
      }
    } else {
      console.log('Passwords do not match');
    }
  }

  showChangeUsername() {
    this.isChangeUsername = true;
    this.isChangePassword = false;
  }

  updateUsername(event: any) {
    this.newUsername = event.target.value;
  }

  submitNewUsername() {
    if (this.newUsername) {
      const user = this.firebaseService.getCurrentUser();
      if (user) {
        this.firebaseService.updateUsername(user.uid, this.newUsername)
          .then(() => {
            console.log('Username updated successfully');
            return user.reload();
          })
          .then(() => {
            this.currentUsername = user.displayName;
          })
          .catch(error => console.error('Error updating username:', error));
      }
    } else {
      console.log('Usernames do not match');
    }
  }
}
