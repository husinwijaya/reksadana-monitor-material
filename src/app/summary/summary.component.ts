import {Component, OnInit} from '@angular/core';
import {LocalStorageService} from '../data-source/local-storage.service';
import {Observable} from 'rxjs';
import {Transaction} from '../data-source/transaction';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css'],
})
export class SummaryComponent implements OnInit {

  data$: Observable<Transaction[]>;

  constructor(private storage: LocalStorageService) {
  }

  ngOnInit() {
    this.data$ = this.storage.getAllTransaction();
  }

}
