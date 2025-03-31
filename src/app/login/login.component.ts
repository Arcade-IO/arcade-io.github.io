import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { signInWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [NgIf],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private firebaseService: FirebaseService) {}

  sendEmail(event: any): void {
    this.email = event.target.value;
  }

  sendPassword(event: any): void {
    this.password = event.target.value;
  }

  login(): void {
    if (!this.email || !this.password) {
      alert('Email and password cannot be empty.');
      return;
    }

    const auth = getAuth();

    signInWithEmailAndPassword(auth, this.email, this.password)
      .then((userCredential) => {
        console.log('Login successful:', userCredential.user);

        if (!userCredential.user.emailVerified) {
          signOut(auth);
          this.errorMessage = "You need to verify your email before you can login.";
          return;
        }
        this.errorMessage = "";
        // Hent brugerdata fra Firebase
        this.firebaseService.getUserbyUID(userCredential.user.uid)
          .then((userData) => {
            console.log("Fetched user data:", userData);
            const displayName = userData.displayName || "Bruger";
            localStorage.setItem('uid', userCredential.user.uid);
            localStorage.setItem('playerName', displayName);
            console.log("Set uid and playerName in localStorage:", userCredential.user.uid, displayName);
            this.router.navigate(['/dashboard']);
          })
          .catch((error) => {
            console.error("Error fetching user data:", error);
            // Fallback, hvis data ikke kan hentes
            localStorage.setItem('uid', userCredential.user.uid);
            localStorage.setItem('playerName', userCredential.user.displayName || "Bruger");
            this.router.navigate(['/dashboard']);
          });
      })
      .catch((error) => {
        console.error('Error during login:', error.code, error.message);
        alert('Error: ' + error.message);
      });
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }
}