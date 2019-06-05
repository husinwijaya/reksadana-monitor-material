import { TestBed } from '@angular/core/testing';

import { PasarDanaService } from './pasar-dana.service';

describe('PasarDanaService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PasarDanaService = TestBed.get(PasarDanaService);
    expect(service).toBeTruthy();
  });
});
