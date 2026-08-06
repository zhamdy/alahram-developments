import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AdminApiService, AdminContact } from '../services/admin-api.service';
import { LucideMailOpen, LucideTrash2, LucideMail } from '@lucide/angular';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'ahram-contact-list',
  standalone: true,
  imports: [DatePipe, LucideMailOpen, LucideTrash2, LucideMail],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.scss',
})
export class ContactListComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  protected contacts = signal<AdminContact[]>([]);
  protected loading = signal(true);
  protected page = signal(1);
  protected totalPages = signal(1);
  protected total = signal(0);

  ngOnInit(): void {
    this.loadContacts();
  }

  protected loadContacts(): void {
    this.loading.set(true);
    this.api.getContacts(this.page(), 25).subscribe({
      next: res => {
        this.contacts.set(res.data);
        this.totalPages.set(res.meta.totalPages);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected markRead(id: number): void {
    this.api.markContactRead(id).subscribe(() => {
      this.contacts.update(list =>
        list.map(c => (c.id === id ? { ...c, isRead: 1 } : c))
      );
    });
  }

  protected deleteContact(id: number): void {
    if (!confirm('Delete this message?')) return;
    this.api.deleteContact(id).subscribe(() => this.loadContacts());
  }

  protected goToPage(p: number): void {
    this.page.set(p);
    this.loadContacts();
  }
}
