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

   // show/hide different sections

  isChangePassword = false;
  isChangeUsername = false;
  isChangeTheme = false;
  isChangeProfilePic = false;

  //password inputs
  newPassword = '';
  confirmPassword = '';

  //username inputs
  newUsername = '';
  currentUsername: string | null = '';

  // theme settings
  backgroundColor = '';
  navbarColor = '';

  // profile picture
  selectedFile: File | null = null;
  uploading = false;
  showProfileMenu = false;
  deleting = false;

  user: any = {}; // Holds current user info including Cloudinary photoURL + publicId

  // Firebase Cloud Function URL (for deleting images in Cloudinary)
  private readonly DELETE_FN_URL = 'https://<REGION>-<PROJECT_ID>.cloudfunctions.net/deleteCloudinaryImage';

  constructor(private firebaseService: FirebaseService, private http: HttpClient) {}

  ngOnInit() {
    // check if user is logged in
    const auth = getAuth();
    onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) return;
      this.user = user;

      this.currentUsername = user.displayName || 'Not set';

      try {
        // get user data from Firebase
        const userData = await this.firebaseService.getUserbyUID(user.uid);
        
        // load saved theme
        const theme = userData?.theme;
        if (theme?.backgroundColor) {
          this.backgroundColor = theme.backgroundColor;
          document.body.style.backgroundColor = this.backgroundColor;
        }
        if (theme?.navbarColor) {
          this.navbarColor = theme.navbarColor;
          document.querySelector('.sidebar')?.setAttribute('style', `background-color: ${this.navbarColor}`);
        }

        // load profile picture
        if (userData?.photoURL) this.user.photoURL = userData.photoURL;
        if (userData?.photoPublicId) this.user.photoPublicId = userData.photoPublicId;
      } catch (err) {
        console.error('Error loading user data:', err);
      }

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
    // check if passwords match
    if (this.newPassword !== this.confirmPassword) {
      console.log('Passwords do not match');
      return;
    }
    const user = this.firebaseService.getCurrentUser();
    if (user) {
      // update password in Firebase
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

    
    // check if username is already taken
    get(usernameQuery).then(snapshot => {
      if (snapshot.exists()) {
        alert('Username is already taken.');
        return;
      }
      const user = this.firebaseService.getCurrentUser();
      if (user) {
         // update username in Firebase + auth profile
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
    
  // save theme in Firebase
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
  // delete image from Cloudinary
  private async deleteFromCloudinary(publicId: string): Promise<void> {
    try {
      await this.http.post<any>(this.DELETE_FN_URL, {
        publicId: publicId,
        resourceType: 'image',
        invalidate: true
      }).toPromise();
    } catch (err) {
      console.error('Cloudinary delete error:', err);
    }
  }

  uploadProfilePicture() {
    if (!this.selectedFile) return;
    this.uploading = true;

    // prepare form data
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('upload_preset', 'ImageUploader');
    
    // upload to Cloudinary
    this.http.post<any>(
      'https://api.cloudinary.com/v1_1/dshaoiftz/image/upload',
      formData
    ).subscribe({
      next: async (res) => {
        const imageUrl: string = res.secure_url;
        const newPublicId: string = res.public_id;
        const user = this.firebaseService.getCurrentUser();
        if (!user) {
          this.uploading = false;
          return;
        }

        const db = this.firebaseService.getDatabase();
        const userRef = ref(db, `users/${user.uid}`);
        const oldPublicId: string | null = this.user?.photoPublicId || null;

        // save new image in Firebase
        update(userRef, { photoURL: imageUrl, photoPublicId: newPublicId })
          .then(async () => {
            this.user.photoURL = imageUrl;
            this.user.photoPublicId = newPublicId;
            const hadOld = !!oldPublicId && oldPublicId !== newPublicId;
            this.selectedFile = null;
            this.uploading = false;
            this.showProfileMenu = false;
            alert('Profile picture updated successfully!');
          // delete old image if exists
            if (hadOld) await this.deleteFromCloudinary(oldPublicId as string);
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

  async deleteProfilePicture() {
    if (!confirm('Are you sure you want to delete your profile picture?')) return;

    const user = this.firebaseService.getCurrentUser();
    if (!user) return;

    const db = this.firebaseService.getDatabase();
    const userRef = ref(db, `users/${user.uid}`);
    const publicId: string | null = this.user?.photoPublicId || null;
    this.deleting = true;

    try {
      // delete from Cloudinary and Firebase
      if (publicId) await this.deleteFromCloudinary(publicId);
      await update(userRef, { photoURL: null, photoPublicId: null });
      this.user.photoURL = null;
      this.user.photoPublicId = null;
      this.showProfileMenu = false;
      alert('Profile picture deleted!');
    } catch (err) {
      console.error('Error deleting profile picture:', err);
    } finally {
      this.deleting = false;
    }
  }

}
