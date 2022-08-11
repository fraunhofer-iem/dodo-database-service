import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class TechnicalDebtService {
  private readonly logger = new Logger(TechnicalDebtService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  @OnEvent('kpi.prepared.technicalDebt')
  async technicalDebt(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { fileSeparation, resolutionInTime } = data;

    const technicalDebt =
      (isNaN(fileSeparation) ? 0 : fileSeparation) +
      (isNaN(resolutionInTime) ? 0 : resolutionInTime) / 2;

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: technicalDebt,
    });
  }
}
