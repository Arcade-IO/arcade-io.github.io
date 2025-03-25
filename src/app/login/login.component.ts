import { Component, NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
//selin 25-05-2025
export class LoginComponent {
  email: string = '';
  password: string = '';

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
