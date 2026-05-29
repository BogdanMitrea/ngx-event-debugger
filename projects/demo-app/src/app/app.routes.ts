import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { FormDemoComponent } from './form-demo/form-demo.component';
import { HttpDemoComponent } from './http-demo/http-demo.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'form', component: FormDemoComponent },
  { path: 'http', component: HttpDemoComponent },
];
