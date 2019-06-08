import {Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Action, Transaction} from '../../data-source/transaction';
import {LocalStorageService} from '../../data-source/local-storage.service';
import {MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  dataSource = new MatTableDataSource<Transaction>();
  Action: typeof Action = Action;
  displayedColumns = ['name', 'action', 'date', 'nab', 'amount', 'totalUnit', 'modify'];

  constructor(private storage: LocalStorageService, private dialog: MatDialog) {
  }

  @Input()
  set data(trx: Transaction[]) {
    this.dataSource.data = trx.slice().sort((a, b) => b.idAsNumber - a.idAsNumber);
  }

  ngOnInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  showDeleteConfirm(trx: Transaction) {
    this.dialog.open(DeleteTransactionDialogComponent, {data: trx}).afterClosed().subscribe(result => {
      if (result) {
        this.storage.deleteTransaction(trx.id).then(() => {
          this.dataSource.data = this.dataSource.data.filter(item => item.id !== trx.id);
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
