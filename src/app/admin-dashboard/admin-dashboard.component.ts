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
  users: User[] = [];
  admins: User[] = [];
  regularUsers: User[] = [];
  searchQuery: string = '';
  isLoading = true;

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    this.fetchUsers();
  }

  // Fetch users and split into admins / non-admins
  async fetchUsers() {
    this.users = await this.firebaseService.getAllUsers();

    let list = [...this.users];
    if (this.searchQuery) {
      const queryLower = this.searchQuery.toLowerCase();
      list = list.filter(user =>
        user.email.toLowerCase().includes(queryLower)
      );
    }

    this.admins = list.filter(u => u.isAdmin);
    this.regularUsers = list.filter(u => !u.isAdmin);

    this.isLoading = false;
  }

  // Search input handler
  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.fetchUsers();
  }

  async toggleAdminRights(user: User) {
    if (user.isAdmin) {
      await this.firebaseService.revokeAdminRights(user.uid);
    } else {
      await this.firebaseService.createAdminRights(user.uid);
    }
    this.fetchUsers();
  }

  async deleteUser(userId: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      await this.firebaseService.deleteUser(userId);
      this.fetchUsers();
    }
  }
}
// selin 26-08-2025