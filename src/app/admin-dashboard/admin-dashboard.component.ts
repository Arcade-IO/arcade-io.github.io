import { Component } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
// selin 25-03-2025
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
// selin 25-03-2025
export class AdminDashboardComponent {
  users: User[] = [];
  filteredUsers: User[] = [];  // Filtered user list
  searchQuery: string = '';  // Store search query manually
  isLoading = true;

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    this.fetchUsers();
  }

  // Fetch users from Firebase and assign to users and filteredUsers
  async fetchUsers() {
    this.users = await this.firebaseService.getAllUsers();
    this.filteredUsers = [...this.users];  // Initially show all users
    this.isLoading = false;
  }

  // Handle the search input event
  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;  // Update the search query
    this.filterUsers();  // Filter users based on the query
  }

  // Filter users based on the search query
  filterUsers() {
    if (!this.searchQuery) {
      this.filteredUsers = [...this.users];  // Show all if no search query
    } else {
      const queryLower = this.searchQuery.toLowerCase();
      this.filteredUsers = this.users.filter(user =>
        user.email.toLowerCase().includes(queryLower)  // Match the search query in email
      );
    }
  }

  async createAdminRights(userId: string) {
    await this.firebaseService.createAdminRights(userId);
    this.fetchUsers();
  }

  async toggleAdminRights(user: User) {
    if (user.isAdmin) {
      await this.firebaseService.revokeAdminRights(user.uid);
    } else {
      await this.firebaseService.createAdminRights(user.uid);
    }
    this.fetchUsers();  // Refresh the user list
  }
  
  
  async deleteUser(userId: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      await this.firebaseService.deleteUser(userId);
      this.fetchUsers();
    }
  }
}
// selin 25-03-2025
