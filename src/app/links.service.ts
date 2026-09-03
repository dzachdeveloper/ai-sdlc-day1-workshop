import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Link {
  code: string;
  url: string;
  shortUrl: string;
  hits: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LinksService {
  private readonly apiUrl = 'http://localhost:3000/api/links';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Link[]> {
    return this.http.get<Link[]>(this.apiUrl);
  }

  create(url: string): Observable<Link> {
    return this.http.post<Link>(this.apiUrl, { url });
  }
}
