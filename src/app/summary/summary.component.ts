import {ChangeDetectorRef, Component, Inject, NgZone, OnInit, ViewChild} from '@angular/core';
import {MatPaginator, MatSort, MatTable, MatTableDataSource} from '@angular/material';
import {Action, Transaction} from '../data-source/transaction';
import {LocalStorageService} from '../data-source/local-storage.service';
import {from, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css'],
})
export class SummaryComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<any>;
  dataSource$: Observable<MatTableDataSource<Transaction>>;
  data: Transaction[] = [];
  Action: typeof Action = Action;
  displayedColumns = ['idAsNumber', 'name', 'action', 'date', 'nab', 'amount', 'totalUnit', 'modify'];

  constructor(private storage: LocalStorageService, private dialog: MatDialog, private zone: NgZone, private ref: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.dataSource$ = from(this.storage.getTransactions(val => this.data.push(val))).pipe(map(() => {
      const ds = new MatTableDataSource<Transaction>(this.data.sort((a, b) => b.idAsNumber - a.idAsNumber));
      ds.paginator = this.paginator;
      ds.sort = this.sort;
      return ds;
    }));
  }

  showDeleteConfirm(trx: Transaction) {
    this.dialog.open(DeleteTransactionDialogComponent, {data: trx}).afterClosed().subscribe(result => {
      if (result) {
        this.storage.deleteTransaction(trx.id).then(() => {
          this.data = this.data.filter(item => item.id !== trx.id);
          (this.table.dataSource as any).data = this.data;
          this.table.renderRows();
        });
      }
    });
  }
}

@Component({
  selector: 'app-delete-trx-dialog',
  template: `<h2 mat-dialog-title>Delete Transaction</h2>
  <mat-dialog-content>
    Are you sure delete transaction {{Action[data.action]}} {{data.name}} at {{data.date|date:'dd-MM-yyyy'}}?
  </mat-dialog-content>
  <mat-dialog-actions>
    <button mat-button mat-dialog-close cdkFocusInitial>No</button>
    <button mat-button [mat-dialog-close]="true">Yes</button>
  </mat-dialog-actions>`
})
export class DeleteTransactionDialogComponent {
  Action: typeof Action = Action;

  constructor(@Inject(MAT_DIALOG_DATA) public data: Transaction) {
  }
}
