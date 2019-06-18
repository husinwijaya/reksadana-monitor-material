import * as moment from 'moment';


export class Transaction implements Suggestion, NabDate {

  public get totalUnit(): number {
    return this.amount / this.nab;
  }

  public get actionDateMMDD(): string {
    return moment(this.date).format('MMDD');
  }

  public get idAsNumber(): number {
    return parseInt(this.id, 10);
  }

  id: string;
  rid: number;
  name: string;
  action: Action;
  date: Date;
  nab: number;
  amount: number;
  type: string;

}

export enum Action {
  Buy = 1, Sell = -1
}

