import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DashboardComponent} from './dashboard/dashboard.component';
import {LayoutModule} from '@angular/cdk/layout';
import {
  MAT_DATE_FORMATS,
  MatButtonModule,
  MatCardModule,
  MatDialogModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatPaginatorModule,
  MatRadioModule,
  MatSelectModule,
  MatSidenavModule,
  MatSortModule,
  MatTableModule,
  MatToolbarModule
} from '@angular/material';
import {DeleteTransactionDialogComponent, SummaryComponent} from './summary/summary.component';
import {DetailComponent} from './detail/detail.component';
import {EntryComponent} from './entry/entry.component';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatMomentDateModule} from '@angular/material-moment-adapter';
import {HttpClientModule} from '@angular/common/http';
import {registerLocaleData} from '@angular/common';
import localeId from '@angular/common/locales/id';

registerLocaleData(localeId);
const appRoutes: Routes = [
  {path: 'summary', component: SummaryComponent},
  {path: 'entry', component: EntryComponent},
  {path: 'entry/:id', component: EntryComponent},
  {path: 'detail', component: DetailComponent},
  {path: '', redirectTo: '/entry', pathMatch: 'full'},
];
export const DATE_PICKER_FORMAT = {
  display: {
    dateInput: 'D MMM YYYY',
    monthYearLabel: 'MMM YYYY',
  },
};

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    SummaryComponent,
    DeleteTransactionDialogComponent,
    DetailComponent,
    EntryComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    ReactiveFormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    HttpClientModule,
    MatDatepickerModule,
    MatMomentDateModule,
    RouterModule.forRoot(appRoutes),
    MatDialogModule,
  ],
  providers: [{provide: MAT_DATE_FORMATS, useValue: DATE_PICKER_FORMAT}],
  entryComponents: [DeleteTransactionDialogComponent],
  bootstrap: [AppComponent]
})
export class AppModule {
}
