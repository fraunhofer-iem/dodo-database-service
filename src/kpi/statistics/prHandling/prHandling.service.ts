import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { min } from 'lodash';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class PrHandlingService {
  private readonly logger = new Logger(PrHandlingService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  @OnEvent('kpi.prepared.prHandlingIndex')
  public async prHandlingIndex(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { prAcceptanceRatio, prSpread, avgPrComplexity } = data;

    let prHandlingIndex =
      (prAcceptanceRatio + 2 * prSpread + 3 * (1 - min([1, avgPrComplexity]))) /
      6;

    if (prHandlingIndex > 1) {
      prHandlingIndex = 1;
    }

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: isNaN(prHandlingIndex) ? {} : prHandlingIndex,
    });
  }
}
