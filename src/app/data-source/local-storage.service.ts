import {Injectable} from '@angular/core';
import {NgForage} from 'ngforage';
import {Transaction} from './transaction';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  private static lastId = 0;

  constructor(private transactionStorage: NgForage) {
    this.transactionStorage.keys().then(keys => keys.forEach(key =>
      LocalStorageService.lastId = Math.max(+key, LocalStorageService.lastId, 0)
    ));
  }

  private static generateId() {
    try {
      return (LocalStorageService.lastId + 1).toString();
    } finally {
      LocalStorageService.lastId++;
    }
  }

  save(trx: Transaction): void {
    if (!trx.id) {
      trx.id = LocalStorageService.generateId();
    }
    this.transactionStorage.setItem(trx.id, trx).then(() => console.log('saved', trx));
  }

  getTransactions(callback: (val: Transaction) => void): Promise<void> {
    return this.transactionStorage.iterate((value: Transaction) => {
      callback(Object.assign(new Transaction(), value));
    });
  }

  getTransactionById(id: string) {
    if (id) {
      return this.transactionStorage.getItem<Transaction>(id).then(item => {
        if (item) {
          return Object.assign(new Transaction(), item);
        }
        return item;
      });
    }
    return null;
  }

  deleteTransaction(id: string) {
    return this.transactionStorage.removeItem(id);
  }
}
