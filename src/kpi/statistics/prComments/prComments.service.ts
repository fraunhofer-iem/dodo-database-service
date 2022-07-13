import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class PrCommentsService {
  private readonly logger = new Logger(PrCommentsService.name);

  constructor(
    private repoService: RepositoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.prepared.prComments')
  public async prComments(payload: CalculationEventPayload) {
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

    const prComments: { [key: string]: number } = Object.fromEntries(
      pullRequests.map((pullRequest) => {
        return [pullRequest.url, pullRequest.comments];
      }),
    );
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: prComments,
    });
  }

  @OnEvent('kpi.prepared.prCommentRatio')
  public async prCommentRatio(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { prComments, prChurnRatio, prChangeRatio } = data;
    const { threshold } = kpi.params;

    const prCommentRatio = Object.fromEntries(
      Object.entries(prComments).map((entry) => [
        entry[0],
        +entry[1] /
          (threshold * prChurnRatio[entry[0]] * prChangeRatio[entry[0]]),
      ]),
    );
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: prCommentRatio,
    });
  }
}
