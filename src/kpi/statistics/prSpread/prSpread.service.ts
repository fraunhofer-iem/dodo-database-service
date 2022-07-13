import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { minBy, sumBy } from 'lodash';
import { CommitService } from 'src/entities/commits/commit.service';
import { Commit } from 'src/entities/commits/model/schemas';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class PrSpreadService {
  private readonly logger = new Logger(PrSpreadService.name);

  constructor(
    private repoService: RepositoryService,
    private commitService: CommitService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.prepared.prCreationDates')
  public async prCreationDates(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;
    const pullRequests = await this.repoService
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

    const prCreationDates = Object.fromEntries(
      pullRequests.map((pullRequest) => [
        new Date(pullRequest.created_at).toISOString().split('T')[0],
        pullRequest.url,
      ]),
    );
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: prCreationDates,
    });
  }

  @OnEvent('kpi.prepared.prSpread')
  public async prComplexity(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { prCreationDates } = data;

    const commits: Commit[] = await this.commitService
      .preAggregate({ repo: (release.repo as any)._id }, {})
      .exec();

    const numberOfPRs = sumBy(
      Object.values(prCreationDates),
      (value: string[]) => value.length,
    );
    const from =
      since ?? new Date(minBy(commits, (commit) => commit.timestamp).timestamp);
    const expectedSpread =
      numberOfPRs /
      ((new Date(release.published_at).getTime() - from.getTime()) /
        (1000 * 3600 * 24));

    const actualSpread = numberOfPRs / Object.keys(prCreationDates).length;

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: expectedSpread / actualSpread,
    });
  }
}
