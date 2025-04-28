import { CommonModule } from '@angular/common';
import { Component, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { Product, ProductService } from '../../service/product.service';
import { StudentDialogComponent } from '../student-dialog/student-dialog.component';
import { ExportColumn, Column } from '../../../core/model/table.model';


@Component({
  selector: 'app-student-list',
  imports: [
            CommonModule,
            TableModule,
            FormsModule,
            ButtonModule,
            RippleModule,
            ToastModule,
            ToolbarModule,
            RatingModule,
            InputTextModule,
            DialogModule,
            TagModule,
            InputIconModule,
            IconFieldModule,
            ConfirmDialogModule,
            StudentDialogComponent     
         ],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss',
  providers: [MessageService, ProductService, ConfirmationService]
})
export class StudentListComponent {
     productDialog: boolean = false;
 
     products = signal<Product[]>([]);
 
     product!: Product;
 
     selectedProducts!: Product[] | null;
 
     submitted: boolean = false;
 
     statuses!: any[];
 
 
     exportColumns!: ExportColumn[];
 
     cols!: Column[];
 
     constructor(
         private productService: ProductService,
         private messageService: MessageService,
         private confirmationService: ConfirmationService
     ) {}
 

     ngOnInit() {
         this.loadDemoData();
     }
 
     loadDemoData() {
         this.productService.getProducts().then((data) => {
             this.products.set(data);
         });
 
         this.statuses = [
             { label: 'INSTOCK', value: 'instock' },
             { label: 'LOWSTOCK', value: 'lowstock' },
             { label: 'OUTOFSTOCK', value: 'outofstock' }
         ];
 
         this.cols = [
             { field: 'code', header: 'Code', customExportHeader: 'Product Code' },
             { field: 'name', header: 'Name' },
             { field: 'image', header: 'Image' },
             { field: 'price', header: 'Price' },
             { field: 'category', header: 'Category' }
         ];
 
         this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
     }
 
     onGlobalFilter(table: Table, event: Event) {
         table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
     }
 
     openNew() {
         this.product = {};
         this.submitted = false;
         this.productDialog = true;
     }
 
     editProduct(product: Product) {
         this.product = { ...product };
         this.productDialog = true;
     }
 
     hideDialog() {
         this.productDialog = false;
         this.submitted = false;
     }
 
     deleteProduct(product: Product) {
         this.confirmationService.confirm({
             message: 'Are you sure you want to delete ' + product.name + '?',
             header: 'Confirm',
             icon: 'pi pi-exclamation-triangle',
             accept: () => {
                 this.products.set(this.products().filter((val) => val.id !== product.id));
                 this.product = {};
                 this.messageService.add({
                     severity: 'success',
                     summary: 'Successful',
                     detail: 'Product Deleted',
                     life: 3000
                 });
             }
         });
     }
 
     findIndexById(id: string): number {
         let index = -1;
         for (let i = 0; i < this.products().length; i++) {
             if (this.products()[i].id === id) {
                 index = i;
                 break;
             }
         }
 
         return index;
     }
 
     createId(): string {
         let id = '';
         var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
         for (var i = 0; i < 5; i++) {
             id += chars.charAt(Math.floor(Math.random() * chars.length));
         }
         return id;
     }
 
     getSeverity(status: string) {
         switch (status) {
             case 'INSTOCK':
                 return 'success';
             case 'LOWSTOCK':
                 return 'warn';
             case 'OUTOFSTOCK':
                 return 'danger';
             default:
                 return 'info';
         }
     }
 
     onProductSave(product: Product) {
         this.submitted = true;
         let _products = this.products();
         if (this.product.name?.trim()) {
             if (this.product.id) {
                 _products[this.findIndexById(this.product.id)] = this.product;
                 this.products.set([..._products]);
                 this.messageService.add({
                     severity: 'success',
                     summary: 'Successful',
                     detail: 'Product Updated',
                     life: 3000
                 });
             } else {
                 this.product.id = this.createId();
                 this.product.image = 'product-placeholder.svg';
                 this.messageService.add({
                     severity: 'success',
                     summary: 'Successful',
                     detail: 'Product Created',
                     life: 3000
                 });
                 this.products.set([..._products, this.product]);
             }
 
             this.productDialog = false;
             this.product = {};
         }
     }
}
