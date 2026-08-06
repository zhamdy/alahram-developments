import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { I18nService } from './i18n.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly api = inject(ApiService);
  private readonly i18n = inject(I18nService);

  sendMessage(messages: ChatMessage[]): Observable<string> {
    return this.api
      .post<{ reply: string }>('/chat', { messages, lang: this.i18n.locale() })
      .pipe(map((res) => res.data.reply));
  }
}
