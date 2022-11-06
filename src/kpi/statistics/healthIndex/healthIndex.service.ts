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

    // here I make sure that undefined values are not being taken into account
    const allValues = [
      technicalDebt,
      codeSpread,
      noGodClassIndex,
      overallWorkInProgress,
      prHandlingIndex,
    ];
    let definedValues = allValues.filter(
      (value) => typeof value !== 'undefined',
    );
    definedValues = definedValues.map((value) => {
      if (value === 'technicalDebt') {
        console.log('TD');
        return 1 - value;
      } else {
        return value;
      }
    });
    let sum = 0;
    for (let value of definedValues) {
      sum += value;
    }
    console.log(definedValues);
    console.log(sum);
    const repoHealth = sum / definedValues.length;

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: repoHealth,
    });
  }
}
