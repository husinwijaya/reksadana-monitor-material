import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class PasarDanaService {

  constructor(private http: HttpClient) {
  }

  public getRdnSuggestion(name: string): Observable<Suggestion[]> {
    return this.http.get<Array<Suggestion>>(`/pasardana/api/FundSearchResult/GetAll` +
      `?pageBegin=1&pageLength=100&sortField=Name&sortOrder=ASC&Keywords=${name}`)
      .pipe(map(rawData => {
        return rawData.map((result: any) => ({
          rid: result.Id,
          name: result.Name,
        }));
      }));
  }

  getNabPrediction(reksadanaId: number, nabDate: moment.Moment): Observable<NabDate[]> {
    const start = moment(nabDate).subtract(3, 'days').toDate();
    const end = moment(nabDate).add(3, 'days').toDate();
    return this.getNabHistory(reksadanaId, start, end);
  }

  getNabHistory(reksadanaId: number, startDate: Date, endDate: Date): Observable<NabDate[]> {
    return this.http.get<any>(`/pasardana/api/FundService/GetSnapshot` +
      `?snapshotTimestamp=undefined&username=anonymous&fundId=${reksadanaId}`)
      .pipe(map(result => {
        return result.NetAssetValues
          .filter(nav => moment(nav.Date, 'YYYY-MM-DDTHH:mm:ss')
            .isBetween(moment(startDate).subtract(1, 'day'), moment(endDate).add(1, 'day'), 'day'))
          .map(nav => ({
            date: moment(nav.Date, 'YYYY-MM-DDTHH:mm:ss').toDate(),
            nab: nav.Value,
          }));
      }));
  }

  getLastNab(reksadanaId: number): Promise<NabDate> {
    return this.http.get<any>(`/pasardana/api/FundService/GetSnapshot` +
      `?snapshotTimestamp=undefined&username=anonymous&fundId=${reksadanaId}`)
      .pipe(map(result => {
        const navs = result.NetAssetValues;
        const lastNav = navs[navs.length - 1];
        return ({date: moment(lastNav.Date, 'YYYY-MM-DDTHH:mm:ss').toDate(), nab: lastNav.Value});
      })).toPromise();
  }
}
