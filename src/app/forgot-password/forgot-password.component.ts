import { Component, NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { NgModel } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl:'./forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  providers: [FirebaseService], 
  imports: [CommonModule]
})
export class ForgotPasswordComponent {
  email: string = '';
  errorMessage: string = '';
  isError: boolean = false;

  constructor(private router: Router, private firebaseService: FirebaseService) {}

  sendEmail(event: Event) {
    this.email = (event.target as HTMLInputElement).value;
  }

  resetPassword() {
    if (!this.email) {
      this.errorMessage = 'Please enter your email';
      return;
    }

    this.firebaseService.resetPassword(this.email)
      .then(() => {
        alert('Password reset email sent!');
        this.router.navigate(['/login']);
      })
      .catch(err => {
        this.errorMessage = err.message || 'Error sending reset email';
      });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
