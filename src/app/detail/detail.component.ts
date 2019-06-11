import {Component, OnInit} from '@angular/core';
import * as moment from 'moment';
import * as randomColor from 'randomcolor';
import {Action, Transaction} from '../data-source/transaction';
import {LocalStorageService} from '../data-source/local-storage.service';
import {PasarDanaService} from '../data-source/pasar-dana.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class DetailComponent implements OnInit {
  nabData: any;
  profitData: any;
  profitPercentageData: any;
  maxLookback = new Date(2019, 0);

  constructor(private storage: LocalStorageService, private service: PasarDanaService) {
  }

  async ngOnInit() {
    const mainTransaction: { [key: number]: Transaction[] } = {};
    await this.storage.getTransactions((transaction: Transaction): void => {
      if (!mainTransaction[transaction.rid]) {
        mainTransaction[transaction.rid] = [];
      }
      mainTransaction[transaction.rid].push(transaction);
      mainTransaction[transaction.rid].sort((a: Transaction, b: Transaction) => a.date.getTime() - b.date.getTime());
    });
    const models = {};
    await Promise.all(Object.values(mainTransaction).map(trx => trx[0]).map((transaction: Transaction) => {
      const maxLookbackDate = moment.max(moment(this.maxLookback), moment(transaction.date)).toDate();
      return this.service.getNabHistory(transaction.rid, maxLookbackDate, new Date()).toPromise().then(nabHistories => {
        models[transaction.name] = nabHistories.map(nabHistory => Object.assign(new Transaction(), nabHistory))
          .reduce((prev, curr) => {
            prev[curr.actionDateMMDD] = curr.nab;
            return prev;
          }, {});
      });
    }));
    const labels: string[] = Array.from(new Set([].concat.apply([], Object.values(models).map(x => Object.keys(x))).sort()));
    const calculationPerRdn: { [key: string]: { [key: number]: any } } = {};
    Object.values(mainTransaction).forEach((value) => {
      const portofolioName = value[0].name;
      if (!calculationPerRdn[portofolioName]) {
        calculationPerRdn[portofolioName] = {};
      }
      value.forEach((portofolio: Transaction) => {
        labels.forEach((date) => {
          if (!calculationPerRdn[portofolioName][date]) {
            calculationPerRdn[portofolioName][date] = {};
            calculationPerRdn[portofolioName][date].accSpending = 0;
            calculationPerRdn[portofolioName][date].accTotalUnit = 0;
            calculationPerRdn[portofolioName][date].nab = +models[portofolioName][date];
          }
          if (date >= portofolio.actionDateMMDD) {
            if (date === portofolio.actionDateMMDD && Action.Sell === +portofolio.action) {
              calculationPerRdn[portofolioName][date].sold = true;
              calculationPerRdn[portofolioName][date].lastAccSpending = calculationPerRdn[portofolioName][date].accSpending;
            }
            calculationPerRdn[portofolioName][date].accSpending += portofolio.amount * portofolio.action;
            calculationPerRdn[portofolioName][date].accTotalUnit += portofolio.totalUnit * portofolio.action;
          }
        });
      });
      Object.keys(calculationPerRdn[portofolioName]).map(idx => calculationPerRdn[portofolioName][idx]).forEach(acc => {
        if (acc.accTotalUnit >= 1) {
          acc.profit = acc.accTotalUnit * acc.nab - acc.accSpending;
          acc.profitPercentage = acc.profit / acc.accSpending * 100;
        } else if (acc.sold) {
          acc.profit = acc.accSpending * -1;
          acc.profitPercentage = acc.profit / acc.lastAccSpending * 100;
        }
      });
    });
    const generatedColor = Object.keys(models).reduce((prev, curr) => {
      prev[curr] = randomColor();
      return prev;
    }, {});
    const datasets1 = Object.keys(models).map(label => {
      return {
        label,
        data: labels.map(date => models[label][date]).map(this.roundDec),
        fill: false,
        borderColor: generatedColor[label]
      };
    });
    const datasets2 = Object.keys(calculationPerRdn).map(label => {
      return {
        label,
        data: labels.map(date => calculationPerRdn[label][date].profit).map(this.roundDec),
        fill: false,
        borderColor: generatedColor[label]
      };
    });
    const datasets3 = Object.keys(calculationPerRdn).map(label => {
      return {
        label,
        data: labels.map(date => calculationPerRdn[label][date].profitPercentage),
        fill: false,
        borderColor: generatedColor[label]
      };
    });
    this.nabData = {labels, datasets: datasets1};
    this.profitData = {labels, datasets: datasets2};
    this.profitPercentageData = {labels, datasets: datasets3};
  }

  private roundDec(val: number) {
    if (val) {
      return val.toFixed(2);
    }
    return val;
  }

  updateLookback(number: number) {
    this.maxLookback = moment(new Date()).startOf('day').subtract(number, 'month').toDate();
    this.ngOnInit();
  }
}
