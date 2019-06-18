import {Component, NgZone, OnInit} from '@angular/core';
import * as moment from 'moment';
import {Action, Transaction} from '../data-source/transaction';
import {LocalStorageService} from '../data-source/local-storage.service';
import {PasarDanaService} from '../data-source/pasar-dana.service';
import * as Highcharts from 'highcharts/highstock';
import {Series} from 'highcharts';
import {HighchartsChartComponent} from 'highcharts-angular';


@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class DetailComponent implements OnInit {

  constructor(private storage: LocalStorageService, private service: PasarDanaService, private zone: NgZone) {
  }

  Highcharts: typeof Highcharts = Highcharts;
  nabData: any;
  profitData: any;
  profitPercentageData: any;
  types = new Set<string>();

  private static adjustForHighchart(val: [string, number]) {
    return [moment(val[0], 'MMDD').toDate().getTime(), parseFloat(val[1].toFixed(2))];
  }

  private static showData(data: any) {
    return {
      title: {
        text: data[0]
      },
      subtitle: {
        text: 'Source: pasardana.id'
      },
      rangeSelector: {
        enabled: true
      },
      chart: {
        type: 'line',
        zoomType: 'x'
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle'
      },
      xAxis: {
        type: 'datetime',
        title: {
          text: 'Date'
        }
      },
      yAxis: {
        startOnTick: false,
        endOnTick: false,
        title: {
          text: data[1]
        }
      },
      series: data[2]
    };
  }

  async ngOnInit() {
    const mainTransaction: { [key: string]: Transaction[] } = {};
    await this.storage.getTransactions((transaction: Transaction): void => {
      if (!mainTransaction[transaction.name]) {
        mainTransaction[transaction.name] = [];
      }
      mainTransaction[transaction.name].push(transaction);
      mainTransaction[transaction.name].sort((a: Transaction, b: Transaction) => a.date.getTime() - b.date.getTime());
      this.types.add(transaction.type);
    });
    const models = {};
    await Promise.all(Object.values(mainTransaction).map(trx => trx[0]).map((transaction: Transaction) => {
      const maxLookbackDate = moment.max(moment(new Date(2018, 0)), moment(transaction.date)).toDate();
      return this.service.getNabHistory(transaction.rid, maxLookbackDate, new Date()).toPromise().then(nabHistories => {
        models[transaction.name] = nabHistories.map(nabHistory => Object.assign(new Transaction(), nabHistory))
          .reduce((prev, curr) => {
            prev[curr.actionDateMMDD] = curr.nab;
            return prev;
          }, {});
      });
    }));
    const navDates: string[] = Array.from(new Set([].concat.apply([], Object.values(models).map(x => Object.keys(x))).sort()));
    const calculationPerRdn: { [key: string]: { [key: number]: any } } = {};
    Object.values(mainTransaction).forEach((value) => {
      const portofolioName = value[0].name;
      if (!calculationPerRdn[portofolioName]) {
        calculationPerRdn[portofolioName] = {};
      }
      value.forEach((portofolio: Transaction) => {
        navDates.forEach((date) => {
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
      Object.keys(calculationPerRdn[portofolioName]).map(date => calculationPerRdn[portofolioName][date]).forEach(acc => {
        if (acc.accTotalUnit >= 1) {
          acc.profit = acc.accTotalUnit * acc.nab - acc.accSpending;
          acc.profitPercentage = acc.profit / acc.accSpending * 100;
        } else if (acc.sold) {
          acc.profit = acc.accSpending * -1;
          acc.profitPercentage = acc.profit / acc.lastAccSpending * 100;
        }
      });
    });
    this.nabData = DetailComponent.showData(['NAB History (Individual)', 'NAB (Rp.)', Object.keys(calculationPerRdn)
      .map(rdnName => ({
        name: rdnName,
        data: navDates.map(date => [date, models[rdnName][date]])
          .filter(val => val[1]).map(DetailComponent.adjustForHighchart),
        visible: false,
        events: {
          show: (event: Event) => {
            const currentSeries = event.target as unknown as Series;
            currentSeries.chart.series
            // tslint:disable-next-line:triple-equals
              .filter(series => series != currentSeries)
              .forEach(series => series.hide());
            currentSeries.chart.zoomOut();
          }
        }
      }))]);
    this.profitData = DetailComponent.showData(['Profit History', 'Profit (Rp.)', Object.keys(calculationPerRdn)
      .map(rdnName => ({
        name: rdnName,
        data: navDates.map(date => [date, calculationPerRdn[rdnName][date].profit])
          .filter(val => val[1]).map(DetailComponent.adjustForHighchart),
        rdnType: mainTransaction[rdnName][0].type
      }))]);
    this.profitPercentageData = DetailComponent.showData(['Profit Percentage History', 'Profit (%)', Object.keys(calculationPerRdn)
      .map(rdnName => ({
        name: rdnName,
        data: navDates.map(date => [date, calculationPerRdn[rdnName][date].profitPercentage])
          .filter(val => val[1]).map(DetailComponent.adjustForHighchart),
        rdnType: mainTransaction[rdnName][0].type
      }))]);
  }

  filterType(data: string[], profitPercentage: HighchartsChartComponent, profit: HighchartsChartComponent) {
    if (!data) {
      data = [];
    }
    this.profitData.series.forEach(s => {
      s.visible = data.includes(s.rdnType);
    });
    profit.options = this.profitData;
    this.profitPercentageData.series.forEach(s => {
      s.visible = data.includes(s.rdnType);
    });
    profitPercentage.options = this.profitPercentageData;
  }
}
