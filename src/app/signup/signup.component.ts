import { Component } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
//selin 25-03-2025
export class SignupComponent {
  name: string = '';
  email: string = '';
  emailconfirm: string = '';
  password: string = '';
  passwordconfirm: string = '';

  constructor(private firebaseService: FirebaseService, private router: Router) {}

  // Update name value
  updateName(event: any): void {
    this.name = event.target.value;
  }

  // Update email value
  updateEmail(event: any): void {
    this.email = event.target.value;
  }

  // Update email confirm value
  updateEmailConfirm(event: any): void {
    this.emailconfirm = event.target.value;
  }

  // Update password value
  updatePassword(event: any): void {
    this.password = event.target.value;
  }

  // Update password confirm value
  updatePasswordConfirm(event: any): void {
    this.passwordconfirm = event.target.value;
  }

  register(): void {
    if (!this.name || !this.email || !this.emailconfirm || !this.password || !this.passwordconfirm) {
      alert('All fields are required.');
      return;
    }
  
    if (this.email !== this.emailconfirm) {
      alert('Emails do not match.');
      return;
    }
  
    if (this.password !== this.passwordconfirm) {
      alert('Passwords do not match.');
      return;
    }

    const isAdmin = false; // Set to true if you want the user to be an admin

    this.firebaseService.registerUser(this.email, this.password, this.name)
      .then(() => {
        alert('Signup successful!');
        this.router.navigate(['/login']);
      })
      .catch((error) => {
        alert('Error: ' + error.message);
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
//selin 25-03-2025
