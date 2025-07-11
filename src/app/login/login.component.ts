// martin 25-03-2025

import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { signInWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIf],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private router: Router,
    private firebaseService: FirebaseService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    localStorage.clear();
    console.log('🧹 Cleared localStorage on LoginComponent load');
  }

  sendEmail(event: any): void {
    this.email = event.target.value;
  }

  sendPassword(event: any): void {
    this.password = event.target.value;
  }

  login(event?: Event): void {
    event?.preventDefault();

    if (!this.email || !this.password) {
      alert('Email and password cannot be empty.');
      return;
    }

    const auth = getAuth();

    signInWithEmailAndPassword(auth, this.email, this.password)
      .then((userCredential) => {
        console.log('✅ Login successful:', userCredential.user);



        this.errorMessage = '';

        this.firebaseService.getUserbyUID(userCredential.user.uid)
          .then((userData) => {
            console.log('📦 Fetched user data:', userData);
            const displayName = userData.displayName || 'Bruger';
            localStorage.setItem('uid', userCredential.user.uid);
            localStorage.setItem('playerName', displayName);
            console.log('📌 Set uid and playerName in localStorage:', userCredential.user.uid, displayName);

            this.ngZone.run(() => {
              console.log('🚀 Navigating to dashboard...');
              this.router.navigate(['/dashboard']);
            });
          })
          .catch((error) => {
            console.error('⚠️ Error fetching user data:', error);
            localStorage.setItem('uid', userCredential.user.uid);
            localStorage.setItem('playerName', userCredential.user.displayName || 'Bruger');

            this.ngZone.run(() => {
              console.log('🚀 Navigating to dashboard (fallback)...');
              this.router.navigate(['/dashboard']);
            });
          });
      })
      .catch((error) => {
        console.error('❌ Error during login:', error.code, error.message);
        this.errorMessage = 'Login failed: ' + error.message;
      });
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  forgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}
