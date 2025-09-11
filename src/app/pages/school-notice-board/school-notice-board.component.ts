import { NoticeAddComponent } from './notice-add/notice-add.component';
import { CarouselModule } from 'primeng/carousel';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TagModule } from 'primeng/tag';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { NotificationService } from '../service/notification.service';
import { ApiLoaderService } from '../../core/services/loaderService';
import { Notice } from '../models/notification.model';

@Component({
  selector: 'app-school-notice-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    TabViewModule,
    InputTextModule,
    DropdownModule,
    BadgeModule,
    ChipModule,
    ToastModule,
    OverlayPanelModule,
    ScrollPanelModule,
    TagModule,
    PanelModule,
    DividerModule,
    SkeletonModule,
    TooltipModule,
    RippleModule,
    DialogModule,
    CarouselModule,
    NoticeAddComponent
  ],
  providers: [MessageService],
  templateUrl: './school-notice-board.component.html',
  styles: []
})
export class SchoolNoticeBoardComponent implements OnInit {

  selectedCategory = 'ALL';
  noticeForm!: FormGroup;
  isDarkMode = false;
  addDialogVisible = false;
  notificationService = inject(NotificationService);
  loader = inject(ApiLoaderService); 
  notices : Notice[]= [];

  apiCall() {
    this.loader.show("Fetching Assignments");
    this.notificationService.search().subscribe((result) => {
      this.notices = result.content;
      this.loader.hide();
    });
  }

  showAddDialog() {
    this.addDialogVisible = true;
  }
  
  notifications = [
    { id: 1, message: 'New timetable uploaded for Grade 10', type: 'timetable', time: '5 min ago' },
    { id: 2, message: 'Attendance notification sent to parents', type: 'attendance', time: '15 min ago' },
    { id: 3, message: 'Exam announcement published', type: 'exam', time: '1 hour ago' },
    { id: 4, message: 'Cultural fest registration opened', type: 'fest', time: '2 hours ago' }
  ];

  categoryOptions = [
    { label: 'All', value: 'ALL', icon: 'pi pi-th-large', colorClass: 'bg-gray-500' },
    { label: 'General', value: 'GENERAL', icon: 'pi pi-bell', colorClass: 'bg-yellow-500' },
    { label: 'Time Table', value: 'TIMETABLE', icon: 'pi pi-calendar', colorClass: 'bg-blue-500' },
     { label: 'Meeting', value: 'MEETING', icon: 'pi pi-trophy', colorClass: 'bg-emerald-500'},
    { label: 'Attendance', value: 'ATTENDANCE', icon: 'pi pi-users', colorClass: 'bg-orange-500' },
    { label: 'Exam Announcement', value: 'EXAM_ANNOUNCEMENT', icon: 'pi pi-file-edit', colorClass: 'bg-red-500' },
    { label: 'Exam Result', value: 'EXAM_RESULT', icon: 'pi pi-trophy', colorClass: 'bg-green-500' },
    { label: 'Festival', value: 'FEST', icon: 'pi pi-heart', colorClass: 'bg-purple-500' },
    { label: 'Holiday', value: 'HOLIDAY', icon: 'pi pi-exclamation-triangle', colorClass: 'bg-yellow-500' },
    { label: 'Appreciation', value: 'APPRECIATION', icon: 'pi pi-star', colorClass: 'bg-pink-500' },
    { label: 'School Achievement', value: 'SCHOOL_ACHIEVEMENT', icon: 'pi pi-trophy', colorClass: 'bg-emerald-500' }
  ];

  priorityOptions = [
    { label: 'LOW', value: 'LOW', severity: 'success' as const },
    { label: 'MEDIUM', value: 'MEDIUM', severity: 'warn' as const },
    { label: 'HIGH', value: 'HIGH', severity: 'danger' as const }
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.initializeForm();
  }
     @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  ngAfterViewInit() {
    const el = this.scrollContainer.nativeElement;
  }

  scrollLeft() {
    this.scrollContainer.nativeElement.scrollBy({ left: -200, behavior: 'smooth' });
  }

  scrollRight() {
    this.scrollContainer.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
  }
  ngOnInit() {
    this.checkTheme();
      this.apiCall();
  }

  initializeForm() {
    this.noticeForm = this.fb.group({
      categoryType: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['MEDIUM', Validators.required]
    });
  }

  get filteredNotices() {
    return this.selectedCategory === 'ALL' 
      ? this.notices 
      : this.notices.filter(notice => notice.categoryType === this.selectedCategory);
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  selectNewNoticeCategory(category: string) {
    this.noticeForm.patchValue({ categoryType: category });
  }

  selectPriority(priority: string) {
    this.noticeForm.patchValue({ priority });
  }

  getNoticeCount(category: string): number {
    return category === 'ALL' ? this.notices.length : this.notices.filter(n => n.categoryType === category).length;
  }

  getSelectedCategoryName(): string {
    const category = this.categoryOptions.find(cat => cat.value === this.selectedCategory);
    return category ? category.label : 'Unknown Category';
  }

  getCategoryIcon(categoryType: string): string {
    const category = this.categoryOptions.find(cat => cat.value === categoryType);
    return category ? category.icon : 'pi pi-file';
  }

  getCategoryColorClass(categoryType: string): string {
    const category = this.categoryOptions.find(cat => cat.value === categoryType);
    return category ? category.colorClass : 'bg-gray-500';
  }

  getPriorityBorderClass(priority: string): string {
    switch (priority) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return '';
    }
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (priority) {
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warn';
      case 'LOW': return 'success';
      default: return 'info';
    }
  }

 createNotice(formValue: any) {
  let newNotice: Notice = {
    id: this.generateId(),
    academicYear: '2025-2026',
    status: 'PUBLISHED',
    attachments: [],
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    ...formValue // include category-specific details
  };
  this.loader.show("New notice publishing");
  this.notificationService.create(newNotice).subscribe(res=>{
  this.loader.hide();
  this.messageService.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Notice published successfully!',
    life: 3000
  });
  this.addDialogVisible = false;
  this.apiCall();
  })

}


  resetForm() {
    this.noticeForm.reset();
    this.noticeForm.patchValue({ priority: 'MEDIUM' });
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  checkTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    document.documentElement.classList.toggle('dark', this.isDarkMode);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getCategoryLabel(categoryType: string): string {
    const category = this.categoryOptions.find(cat => cat.value === categoryType);
    return category ? category.label : categoryType;
  }
}