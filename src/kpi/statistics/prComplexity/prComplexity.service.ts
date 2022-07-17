import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sum } from 'lodash';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class PrComplexityService {
  private readonly logger = new Logger(PrComplexityService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  @OnEvent('kpi.prepared.prComplexity')
  public async prComplexity(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const {
      prProcessingEfficiency,
      prChangeRatio,
      prChurnRatio,
      prCommentRatio,
    } = data;

    const prComplexity = Object.fromEntries(
      Object.keys(prProcessingEfficiency).map((pullRequest) => [
        pullRequest,
        (prProcessingEfficiency[pullRequest] +
          prChangeRatio[pullRequest] +
          prChurnRatio[pullRequest] +
          prCommentRatio[pullRequest]) /
          4,
      ]),
    );
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: prComplexity,
    });
  }

  @OnEvent('kpi.prepared.avgPrComplexity')
  public async avgPrComplexity(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { prComplexity } = data;

    const avgPrComplexity =
      sum(Object.values(prComplexity)) / Object.values(prComplexity).length;

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: avgPrComplexity,
    });
  }

  @OnEvent('kpi.prepared.stdPrComplexity')
  public async stdPrComplexity(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { prComplexity, avgPrComplexity } = data;

    const stdPrComplexity = Math.sqrt(
      sum(
        Object.values(prComplexity).map((complexity: number) =>
          Math.pow(complexity - avgPrComplexity, 2),
        ),
      ) / Object.values(prComplexity).length,
    );

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: stdPrComplexity,
    });
  }
}
