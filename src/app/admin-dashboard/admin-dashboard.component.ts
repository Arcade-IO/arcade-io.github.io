import { Component } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';

// selin 26-08-2025
interface User {
  uid: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  providers: [FirebaseService],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  users: User[] = []; // all users from database
  admins: User[] = [];  // filtered list of admins
  regularUsers: User[] = [];  // filtered list of non-admins
  searchQuery: string = ''; // search text input
  isLoading = true;   // loading indicator

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    this.fetchUsers();  // load users when component starts
  }

  // Get all users and split into admins / regular users
  async fetchUsers() {
    this.users = await this.firebaseService.getAllUsers();

    let list = [...this.users];
    // If a search query is entered, filter users by email
    if (this.searchQuery) {
      const queryLower = this.searchQuery.toLowerCase();
      list = list.filter(user =>
        user.email.toLowerCase().includes(queryLower)
      );
    }

    // Separate users into admins and non-admins
    this.admins = list.filter(u => u.isAdmin);
    this.regularUsers = list.filter(u => !u.isAdmin);

    this.isLoading = false;
  }

  // Called when typing in the search box
  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.fetchUsers(); 
  }

  // Give or remove admin rights for a user
  async toggleAdminRights(user: User) {
    if (user.isAdmin) {
      await this.firebaseService.revokeAdminRights(user.uid);
    } else {
      await this.firebaseService.createAdminRights(user.uid);
    }
    this.fetchUsers();  // refresh list
  }

  // Permanently delete a user
  async deleteUser(userId: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      await this.firebaseService.deleteUser(userId);
      this.fetchUsers();  // refresh list
    }
  }
}
// selin 26-08-2025