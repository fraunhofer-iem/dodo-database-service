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
    const allValues = [
      prProcessingEfficiency,
      prChangeRatio,
      prChurnRatio,
      prCommentRatio,
    ];
    let definedValues = allValues.filter(
      (value) => typeof value !== 'undefined',
    );
    // prProcessingEfficiency can be undefined, as it only has a value for closed/merged PRs
    // take prCommentRatio to get the pr keys as it will contain every PR, if there is one
    let prComplexity = {};
    if (typeof prCommentRatio !== 'undefined') {
      for (let pullRequest of Object.keys(prCommentRatio)) {
        let valueSum = 0;
        for (let value of definedValues) {
          valueSum += value[pullRequest];
        }
        prComplexity[pullRequest] = valueSum / definedValues.length;
      }
    }

    // if (typeof prCommentRatio !== 'undefined') {
    //   prComplexity = Object.fromEntries(
    //     Object.keys(prCommentRatio).map((pullRequest) => [
    //       pullRequest,
    //       (typeof prProcessingEfficiency === 'undefined'
    //         ? 0
    //         : prProcessingEfficiency[pullRequest] + typeof prChangeRatio ===
    //           'undefined'
    //         ? 0
    //         : prChangeRatio[pullRequest] + typeof prChurnRatio === 'undefined'
    //         ? 0
    //         : prChurnRatio[pullRequest] + typeof prCommentRatio === 'undefined'
    //         ? 0
    //         : prCommentRatio[pullRequest]) / definedValues.length,
    //     ]),
    //   );
    // }

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

    if (typeof prComplexity === 'undefined') {
      this.eventEmitter.emit('kpi.calculated', {
        kpi,
        release,
        since,
        value: {},
      });
    } else {
      let avgPrComplexity =
        sum(Object.values(prComplexity)) / Object.values(prComplexity).length;

      if (avgPrComplexity > 1) {
        avgPrComplexity = 1;
      }
      this.eventEmitter.emit('kpi.calculated', {
        kpi,
        release,
        since,
        value: avgPrComplexity,
      });
    }
  }

  @OnEvent('kpi.prepared.stdPrComplexity')
  public async stdPrComplexity(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { prComplexity, avgPrComplexity } = data;

    if (typeof prComplexity === 'undefined') {
      this.eventEmitter.emit('kpi.calculated', {
        kpi,
        release,
        since,
        value: {},
      });
    } else {
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
}
