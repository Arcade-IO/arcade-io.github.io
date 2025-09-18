import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
import { getAuth, onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { getDatabase, ref, get, query, orderByChild, equalTo, update } from 'firebase/database';
import { HttpClient } from '@angular/common/http';
// Update the import path if your environment file is located elsewhere, for example:
import { environment } from '../../environments/environment';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  imports: [CommonModule]
})
export class SettingsComponent implements OnInit {

  isChangePassword = false;
  isChangeDisplayName = false;
  isChangeTheme = false;
  isChangeProfilePic = false;

  newPassword = '';
  confirmPassword = '';

  newDisplayName = '';
  currentDisplayName: string | null = '';

  backgroundColor = '';
  navbarColor = '';

  selectedFile: File | null = null;
  uploading = false;
  showProfileMenu = false;
  deleting = false;

  user: any = {};

  private readonly SIGN_FN_URL = environment.cloudinarySignFnUrl;

  constructor(private firebaseService: FirebaseService, private http: HttpClient) {}

  ngOnInit() {
    // check if user is logged in
    const auth = getAuth();
    onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) return;
      this.user = user;

      this.currentDisplayName = user.displayName || 'Not set';

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
        if (userData?.photoURL) this.user.photoURL = userData.photoURL;
        if (userData?.photoPublicId) this.user.photoPublicId = userData.photoPublicId;
      } catch (err) {
        console.error('Error loading user data:', err);
      }

      this.optionChangeTheme();
    });
  }

  optionChangePassword() {
    this.isChangePassword = true;
    this.isChangeDisplayName = false;
    this.isChangeTheme = false;
    this.isChangeProfilePic = false;
  }

  optionChangeDisplayName() {
    this.isChangeDisplayName = true;
    this.isChangePassword = false;
    this.isChangeTheme = false;
    this.isChangeProfilePic = false;
  }

  optionChangeTheme() {
    this.isChangeTheme = true;
    this.isChangePassword = false;
    this.isChangeDisplayName = false;
    this.isChangeProfilePic = false;
  }

  optionChangeProfilePic() {
    this.isChangeProfilePic = true;
    this.isChangePassword = false;
    this.isChangeDisplayName = false;
    this.isChangeTheme = false;
  }

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

  updateDisplayName(event: any) {
    this.newDisplayName = event.target.value;
  }

  submitNewDisplayName() {
  const db = this.firebaseService.getDatabase();
  const usersRef = ref(db, 'users');
  const displayNameQuery = query(usersRef, orderByChild('displayName'), equalTo(this.newDisplayName));

  // check if username is already taken
  get(displayNameQuery).then(snapshot => {
    if (snapshot.exists()) {
      alert('Username is already taken.');
      return;
    }

    const user = this.firebaseService.getCurrentUser();
    if (user) {
      // ✅ updateDisplayName handles both Auth + DB update
      this.firebaseService.updateDisplayName(user.uid, this.newDisplayName)
        .then(() => {
          alert('Username updated successfully!');
          this.currentDisplayName = this.newDisplayName;
        })
        .catch(error => console.error('Error updating username:', error));
    }
  }).catch(error => console.error('Error checking username:', error));
}

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

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] || null;
  }

async uploadProfilePicture() {
  if (!this.selectedFile) return;
  this.uploading = true;

  const user = this.firebaseService.getCurrentUser();
  if (!user) return;

  const sig = await this.http.post<any>(this.SIGN_FN_URL, {
    public_id: user.uid
  }).toPromise();

  const form = new FormData();
  form.append('file', this.selectedFile);
  form.append('public_id', sig.public_id);
  form.append('timestamp', String(sig.timestamp));
  form.append('api_key', sig.api_key);
  form.append('signature', sig.signature);
  form.append('overwrite', 'true');
  form.append('invalidate', 'true');

  const uploadRes = await this.http.post<any>(
    `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`,
    form
  ).toPromise();

  const imageUrl = uploadRes.secure_url;
  const newPublicId = uploadRes.public_id;

  const db = this.firebaseService.getDatabase();
  const userRef = ref(db, `users/${user.uid}`);
  await update(userRef, { photoURL: imageUrl, photoPublicId: newPublicId });

  this.user.photoURL = imageUrl;
  this.user.photoPublicId = newPublicId;
  this.selectedFile = null;
  this.uploading = false;
  this.showProfileMenu = false;
  alert('Profile picture updated successfully!');
}


}
