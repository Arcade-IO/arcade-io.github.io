import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FirebaseService } from '../services/firebase.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.css']
})
export class ImageUploaderComponent implements OnInit {
  selectedFile: File | null = null;
  uploading = false;
  searchTerm = '';
uploadedImages: { id: string; name: string; url: string }[] = [];


  constructor(private http: HttpClient, private firebase: FirebaseService) {}

  ngOnInit(): void {
    this.searchImages();
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    console.log('Valgt fil:', this.selectedFile);
  }

  uploadImage(): void {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('upload_preset', 'ImageUploader'); // ← din unsigned preset

    this.uploading = true;

    console.log('Sender følgende FormData:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    this.http.post<any>('https://api.cloudinary.com/v1_1/dshaoiftz/image/upload', formData)
      .subscribe({
        next: async (res) => {
          const imageUrl = res.secure_url;
          const imageName = this.selectedFile?.name ?? 'unknown';

          await this.firebase.saveImageMetadata(imageName, imageUrl);

          this.selectedFile = null;
          this.uploading = false;

          this.searchImages();
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.uploading = false;
        }
      });
  }
async deleteImage(image: { id: string }) {
  if (!confirm(`Er du sikker på, at du vil slette billedet "${image.id}" fra systemet?`)) return;

  try {
    await this.firebase.deleteImageMetadata(image.id);
    this.searchImages(); // Genindlæs listen
  } catch (err) {
    console.error('Kunne ikke slette fra Firebase:', err);
  }
}

  searchImages(): void {
    this.firebase.getImagesByName(this.searchTerm).then(images => {
      this.uploadedImages = images;
    });
  }
}
