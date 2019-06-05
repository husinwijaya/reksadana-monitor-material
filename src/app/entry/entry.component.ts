import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {debounceTime, filter, switchMap, tap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {PasarDanaService} from '../data-source/pasar-dana.service';
import {SelectionModel} from '@angular/cdk/collections';
import * as moment from 'moment';
import {LocalStorageService} from '../data-source/local-storage.service';
import {Transaction} from '../data-source/transaction';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.css'],
})
export class EntryComponent implements OnInit, AfterViewInit {
  trxForm = this.fb.group({
    id: null,
    rdn: [null, Validators.required],
    action: [null, Validators.required],
    actionDate: [null, Validators.required],
    amount: [null, Validators.required]
  });
  suggestedRdnList$: Observable<Suggestion[]>;
  displayedColumns = ['select', 'date', 'nab'];
  selectedNab: SelectionModel<NabDate>;
  nabDates$: Observable<NabDate[]>;
  totalUnit: number;
  actionDateFilter = (d: moment.Moment): boolean => d.isBefore(new Date());

  constructor(private fb: FormBuilder, private datasource: PasarDanaService, private cd: ChangeDetectorRef,
              private storage: LocalStorageService, private route: ActivatedRoute, private router: Router) {
  }

  refreshTotalUnit() {
    if (!this.selectedNab.isEmpty()) {
      this.totalUnit = this.trxForm.value.amount / this.selectedNab.selected[0].nab;
    } else {
      this.totalUnit = 0;
    }
  }

  renderSuggestion(suggestion: Suggestion): string {
    if (suggestion) {
      return suggestion.name;
    }
  }

  ngOnInit(): void {
    console.log(this);
    this.suggestedRdnList$ = this.trxForm.get('rdn').valueChanges.pipe(
      debounceTime(500),
      filter(value => value && typeof value === 'string'),
      switchMap((value) => this.datasource.getRdnSuggestion(value)),
    );
    this.nabDates$ = this.trxForm.valueChanges.pipe(
      filter(formVal => formVal && typeof formVal === 'object'
        && formVal.rdn && typeof formVal.rdn === 'object'
        && formVal.rdn.rid && typeof formVal.rdn.rid === 'number'
        && formVal.actionDate && moment.isMoment(formVal.actionDate)),
      switchMap(formVal => this.datasource.getNabPrediction(formVal.rdn.rid, formVal.actionDate)),
    ).pipe(tap(value => this.selectNabDate(value)));
    this.selectedNab = new SelectionModel<NabDate>(false, []);
  }

  private selectNabDate(nabDates): void {
    const actionDate = this.trxForm.get('actionDate').value as moment.Moment;
    const selectedNabDate = nabDates.find(nabDate => actionDate.isSame(nabDate.date, 'd'));
    if (selectedNabDate) {
      this.selectedNab.select(selectedNabDate);
    } else {
      this.selectedNab.clear();
      this.totalUnit = 0;
    }
  }

  updateNab(row: NabDate, refreshTable: boolean = false): void {
    this.selectedNab.select(row);
    this.trxForm.patchValue({actionDate: moment(row.date), nab: row.nab}, {emitEvent: refreshTable});
    this.refreshTotalUnit();
  }

  isSelected(row: NabDate): boolean {
    if (this.selectedNab.selected.length === 0 || !row) {
      return false;
    }
    const selected = this.selectedNab.selected[0];
    return moment(selected.date).isSame(moment(row.date), 'd') && selected.nab === row.nab;
  }

  onSubmit() {
    const form = this.trxForm.value;
    const nabDate = this.selectedNab.selected[0];
    this.storage.save({
      id: form.id,
      rid: form.rdn.rid,
      name: form.rdn.name,
      action: form.action,
      date: nabDate.date,
      nab: nabDate.nab,
      amount: form.amount
    } as Transaction);
    this.router.navigate(['/summary']);
  }

  ngAfterViewInit(): void {
    this.route.params.subscribe(params => {
      if (params.id) {
        this.storage.getTransactionById(params.id).then(trx => {
          this.trxForm.patchValue({
            id: trx.id,
            rdn: trx as Suggestion,
            action: trx.action.toString(),
            actionDate: moment(trx.date),
            amount: trx.amount,
          });
          this.updateNab({date: trx.date, nab: trx.nab}, true);
          this.cd.detectChanges();
        });
      }
    });

  }
}
