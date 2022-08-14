import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class HealthIndexService {
  private readonly logger = new Logger(HealthIndexService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  @OnEvent('kpi.prepared.orgHealth')
  async orgHealth(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;

    const orgHealth = Math.random() * 100;

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: orgHealth,
    });
  }

  @OnEvent('kpi.prepared.repoHealth')
  async repoHealth(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const {
      technicalDebt,
      codeSpread,
      noGodClassIndex,
      overallWorkInProgress,
      prHandlingIndex,
    } = data;

    const repoHealth =
      (1 -
        technicalDebt +
        codeSpread +
        noGodClassIndex +
        overallWorkInProgress +
        prHandlingIndex) /
      5;

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: repoHealth,
    });
  }
}
