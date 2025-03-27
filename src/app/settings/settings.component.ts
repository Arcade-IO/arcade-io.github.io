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

  isChangeEmail = false;
  newEmail = '';
  currentEmail: string | null = '';

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        this.currentUsername = user.displayName || 'Not set';
      }
    });
  }
  
  
  
  optionChangePassword() {
    this.isChangePassword = true;
    this.isChangeUsername = false;
    this.isChangeEmail = false;
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

  optionChangeUsername() {
    this.isChangeUsername = true;
    this.isChangePassword = false;
    this.isChangeEmail= false;
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


 optionChangeEmail() {
    this.isChangeUsername = false;
    this.isChangePassword = false;
    this.isChangeEmail= true;
  }

  updateEmail(event: any) {
    this.newEmail = event.target.value;
  }

// submitNewEmail() {
//   const user = this.firebaseService.getCurrentUser();
//   if (user && this.newEmail) {
//     this.firebaseService.updateEmail(this.newEmail)
//       .then(() => {
//         this.currentEmail = user.email;  
//         console.log('Email updated successfully');
//         this.currentEmail = this.newEmail;  // Update the current email
//       })
//       .catch(error => console.error('Error updating email:', error));
//   } else {
//     console.log('Please enter a valid email');
//   }
// }

}
//selin 26-03-2025
