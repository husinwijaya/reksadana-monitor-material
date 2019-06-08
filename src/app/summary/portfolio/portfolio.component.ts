import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatPaginator, MatSort, MatTableDataSource} from '@angular/material';
import {Transaction} from '../../data-source/transaction';
import {PasarDanaService} from '../../data-source/pasar-dana.service';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  displayedColumns = ['name', 'amount', 'lastTotalUnit', 'lastTrxDate', 'lastNab', 'lastNabDate', 'pl', 'realPL'];
  dataSource = new MatTableDataSource<any>([]);

  constructor(private datasource: PasarDanaService) {
  }

  @Input()
  set data(trx: Transaction[]) {
    const data = trx.reduce((acc, val) => {
      if (acc[val.rid]) {
        const curr = acc[val.rid];
        curr.amount += val.amount * val.action;
        curr.lastTotalUnit += val.totalUnit * val.action;
        if (val.date.getTime() > curr.lastTrxDate.getTime()) {
          curr.lastTrxDate = val.date;
        }
      } else {
        acc[val.rid] = {rid: val.rid, name: val.name, amount: val.amount, lastTotalUnit: val.totalUnit, lastTrxDate: val.date};
      }
      return acc;
    }, {});
    Promise.all(Object.values(data).map((row: any) => {
      return this.datasource.getLastNab(row.rid).then(result => {
        row.lastNab = result.nab;
        row.lastNabDate = result.date;
        row.realPL = row.lastNab * row.lastTotalUnit - row.amount;
        if (row.lastTotalUnit >= 1) {
          row.pl = row.realPL / row.amount * 100;
        } else {
          row.pl = 0;
        }
        return row;
      });
    })).then((vals) => {
      this.dataSource.data = vals;
    });
  }

  ngOnInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
}
