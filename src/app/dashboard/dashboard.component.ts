import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  games = [
    { id: '1', title: 'Spil 1', imageUrl: 'https://via.placeholder.com/200' },
    { id: '2', title: 'Spil 2', imageUrl: 'https://via.placeholder.com/200' },
    { id: '3', title: 'Spil 3', imageUrl: 'https://via.placeholder.com/200' }
  ];

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    // Subscribe to auth state changes so that the component updates when Firebase restores auth state.
    this.firebaseService.getAuthStateListener((user: any) => {
      this.isLoggedIn = !!user;
      if (user) {
        this.firebaseService.checkIfAdmin(user.uid)
          .then((adminStatus) => {
            this.isAdmin = adminStatus;
          })
          .catch((error) => {
            console.error("Error checking admin status in Dashboard:", error);
            this.isAdmin = false;
          });
      } else {
        this.isAdmin = false;
      }
    });
  }
}
