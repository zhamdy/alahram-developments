import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ChatApiService, ChatMessage } from '@core/services';

@Component({
  selector: 'ahram-chat-widget',
  standalone: true,
  imports: [FormsModule, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss',
})
export class ChatWidgetComponent {
  private readonly chatApi = inject(ChatApiService);
  private readonly transloco = inject(TranslocoService);
  private readonly scrollAnchor = viewChild<ElementRef<HTMLElement>>('scrollAnchor');

  protected readonly isOpen = signal(false);
  protected readonly isSending = signal(false);
  protected readonly draft = signal('');
  protected readonly messages = signal<ChatMessage[]>([
    { role: 'assistant', content: '' }, // replaced with translated greeting on first open
  ]);

  private greeted = false;

  protected toggle(): void {
    this.isOpen.update((open) => !open);
    if (this.isOpen() && !this.greeted) {
      this.greeted = true;
      this.messages.set([
        { role: 'assistant', content: this.transloco.translate('chat.greeting') },
      ]);
    }
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected onDraftInput(value: string): void {
    this.draft.set(value);
  }

  protected send(): void {
    const text = this.draft().trim();
    if (!text || this.isSending()) return;

    const history = [...this.messages(), { role: 'user' as const, content: text }];
    this.messages.set(history);
    this.draft.set('');
    this.isSending.set(true);
    this.scrollToBottom();

    this.chatApi.sendMessage(history).subscribe({
      next: (reply) => {
        this.messages.update((msgs) => [...msgs, { role: 'assistant', content: reply }]);
        this.isSending.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.messages.update((msgs) => [
          ...msgs,
          { role: 'assistant', content: this.transloco.translate('chat.error') },
        ]);
        this.isSending.set(false);
        this.scrollToBottom();
      },
    });
  }

  private scrollToBottom(): void {
    queueMicrotask(() => {
      this.scrollAnchor()?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    });
  }
}
