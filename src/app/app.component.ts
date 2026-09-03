import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Link, LinksService } from './links.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  readonly links = signal<Link[]>([]);
  readonly createdLink = signal<Link | null>(null);
  readonly error = signal('');
  readonly loading = signal(false);
  url = '';

  constructor(private readonly linksService: LinksService) {}

  ngOnInit(): void {
    this.loadLinks();
  }

  shorten(): void {
    this.error.set('');
    this.createdLink.set(null);
    if (!/^https?:\/\/\S+$/i.test(this.url)) {
      this.error.set('Please enter a valid http or https URL.');
      return;
    }
    this.loading.set(true);
    this.linksService.create(this.url).subscribe({
      next: (link) => {
        this.createdLink.set(link);
        this.url = '';
        this.loading.set(false);
        this.loadLinks();
      },
      error: () => {
        this.error.set('Unable to shorten that link. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private loadLinks(): void {
    this.linksService.list().subscribe({
      next: (links) => this.links.set(links),
      error: () => this.error.set('Could not load your links right now.'),
    });
  }
}
