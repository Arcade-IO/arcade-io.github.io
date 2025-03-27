import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { signInWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
// <<-- Added import for NgIf directive
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [NgIf],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
//selin 25-05-2025
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = ''; // <<-- New property for error message

  constructor(private router: Router, private firebaseService: FirebaseService) {}

  // Save email value
  sendEmail(event: any): void {
    this.email = event.target.value;
  }

  // Save password value
  sendPassword(event: any): void {
    this.password = event.target.value;
  }

  // Login function
  login(): void {
    if (!this.email || !this.password) {
      alert('Email and password cannot be empty.');
      return;
    }

    const auth = getAuth();

    signInWithEmailAndPassword(auth, this.email, this.password)
      .then((userCredential) => {
        console.log('Login successful:', userCredential.user);
        // Check if the user's email is verified
        if (!userCredential.user.emailVerified) {
          // <<-- New: If email is not verified, sign out and set the error message.
          signOut(auth);
          this.errorMessage = "You need to verify your email before you can login.";
          return;
        }
        // <<-- If email is verified, clear any error message and navigate to the dashboard.
        this.errorMessage = "";
        this.router.navigate(['/dashboard']);
      })
      .catch((error) => {
        console.error('Error during login:', error.code, error.message);
        alert('Error: ' + error.message);
      });
  }

  // Navigate to signup page
  goToSignup(): void {
    this.router.navigate(['/signup']);
  }
}
//selin 25-05-2025
