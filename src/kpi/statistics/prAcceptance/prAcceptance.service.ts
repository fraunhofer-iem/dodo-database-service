import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sumBy } from 'lodash';
import { PullRequest } from 'src/entities/pullRequests/model/schemas';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class PrAcceptanceService {
  private readonly logger = new Logger(PrAcceptanceService.name);

  constructor(
    private repoService: RepositoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.prepared.prAcceptanceRatio')
  public async prAcceptanceRatio(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;
    const pullRequests: PullRequest[] = await this.repoService
      .preAggregate(
        { _id: (release.repo as any)._id },
        {
          diffs: {
            pullRequest: {
              since: since ? since.toUTCString() : undefined,
              to: release.published_at,
            },
          },
        },
      )
      .unwind('$diffs')
      .replaceRoot('$diffs')
      .replaceRoot('$pullRequest')
      .exec();

    const acceptedPrCount = sumBy(pullRequests, (pr) => (pr.closed_at ? 1 : 0));
    const prAcceptanceRatio = acceptedPrCount / pullRequests.length;

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: isNaN(prAcceptanceRatio) ? 0 : prAcceptanceRatio,
    });
  }
}
