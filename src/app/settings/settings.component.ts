import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
import { getAuth, onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { getDatabase, ref, get, query, orderByChild, equalTo, update } from 'firebase/database';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  imports: [CommonModule]
})
export class SettingsComponent implements OnInit {

  // ---------------- Sections visibility ----------------
  isChangePassword = false;
  isChangeUsername = false;
  isChangeTheme = false;
  isChangeProfilePic = false;

  // ---------------- Password ----------------
  newPassword = '';
  confirmPassword = '';

  // ---------------- Username ----------------
  newUsername = '';
  currentUsername: string | null = '';

  // ---------------- Theme ----------------
  backgroundColor = '';
  navbarColor = '';

  // ---------------- Profile Picture ----------------
  selectedFile: File | null = null;
  uploading = false;
  showProfileMenu = false;

  user: any = {}; // Holds current user info including Cloudinary photoURL

  constructor(private firebaseService: FirebaseService, private http: HttpClient) {}

  ngOnInit() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) return;
      this.user = user;

      // Load username
      this.currentUsername = user.displayName || 'Not set';

      // Load theme from Firebase
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

        // Load Cloudinary profile picture if exists
        if (userData?.photoURL) {
          this.user.photoURL = userData.photoURL;
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      }

      // Default section
      this.optionChangeTheme();
    });
  }

  /** ------------------ SECTION NAVIGATION ------------------ */
  optionChangePassword() {
    this.isChangePassword = true;
    this.isChangeUsername = false;
    this.isChangeTheme = false;
    this.isChangeProfilePic = false;
  }

  optionChangeUsername() {
    this.isChangeUsername = true;
    this.isChangePassword = false;
    this.isChangeTheme = false;
    this.isChangeProfilePic = false;
  }

  optionChangeTheme() {
    this.isChangeTheme = true;
    this.isChangePassword = false;
    this.isChangeUsername = false;
    this.isChangeProfilePic = false;
  }

  optionChangeProfilePic() {
    this.isChangeProfilePic = true;
    this.isChangePassword = false;
    this.isChangeUsername = false;
    this.isChangeTheme = false;
  }

  /** ------------------ PASSWORD ------------------ */
  updatePassword(event: any) {
    this.newPassword = event.target.value;
  }

  updateConfirmPassword(event: any) {
    this.confirmPassword = event.target.value;
  }

  submitNewPassword() {
    if (this.newPassword !== this.confirmPassword) {
      console.log('Passwords do not match');
      return;
    }

    const user = this.firebaseService.getCurrentUser();
    if (user) {
      this.firebaseService.updateUserPassword(user.uid, this.newPassword)
        .then(() => alert('Password updated successfully'))
        .catch(error => console.error('Error updating password:', error));
    }
  }

  /** ------------------ USERNAME ------------------ */
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

  /** ------------------ THEME ------------------ */
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
        document.querySelector('.Navbar')?.setAttribute('style', `background-color: ${this.navbarColor}`);
        alert('Theme updated successfully!');
        location.reload();
      })
      .catch(err => console.error('Error saving theme to Firebase:', err));
  }

  /** ------------------ PROFILE PICTURE ------------------ */
  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] || null;
  }

  uploadProfilePicture() {
    if (!this.selectedFile) return;
    this.uploading = true;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('upload_preset', 'ImageUploader'); // ← your Cloudinary unsigned preset

    this.http.post<any>(
      'https://api.cloudinary.com/v1_1/dshaoiftz/image/upload',
      formData
    ).subscribe({
      next: async (res) => {
        const imageUrl = res.secure_url;
        const user = this.firebaseService.getCurrentUser();
        if (!user) return;

        // Save Cloudinary URL in Firebase
        const db = this.firebaseService.getDatabase();
        const userRef = ref(db, `users/${user.uid}`);
        update(userRef, { photoURL: imageUrl })
          .then(() => {
            this.user.photoURL = imageUrl; // update preview
            this.selectedFile = null;
            this.uploading = false;
            this.showProfileMenu = false;
            alert('Profile picture updated successfully!');
          })
          .catch(err => {
            console.error('Error saving profile picture:', err);
            this.uploading = false;
          });
      },
      error: err => {
        console.error('Cloudinary upload error:', err);
        this.uploading = false;
      }

      
    });
  }

  deleteProfilePicture() {
    if (!confirm('Are you sure you want to delete your profile picture?')) return;

    const user = this.firebaseService.getCurrentUser();
    if (!user) return;

    const db = this.firebaseService.getDatabase();
    const userRef = ref(db, `users/${user.uid}`);

    update(userRef, { photoURL: null })
      .then(() => {
        this.user.photoURL = null; // show default avatar
        this.showProfileMenu = false;
        alert('Profile picture deleted!');
      })
      .catch(err => console.error('Error deleting profile picture from Firebase:', err));
  }

  
}
