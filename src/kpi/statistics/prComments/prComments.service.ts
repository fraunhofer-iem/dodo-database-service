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
    console.log(prComments);
    console.log(prChurnRatio);
    console.log(prChangeRatio);
    if (
      typeof prComments === 'undefined' &&
      typeof prChurnRatio === 'undefined' &&
      typeof prChangeRatio === 'undefined'
    ) {
      this.eventEmitter.emit('kpi.calculated', {
        kpi,
        release,
        since,
        value: {},
      });
    } else {
      const prCommentRatio: { [key: string]: number } = {};
      // const prCommentRatio = Object.fromEntries(
      //   Object.entries(prComments).map((entry) => {
      //     const expectedNumberOfComments =
      //       +entry[1] /
      //       (threshold * prChurnRatio[entry[0]] * prChangeRatio[entry[0]]);
      //     return [
      //       entry[0],
      //       isNaN(expectedNumberOfComments) ? 1 : expectedNumberOfComments,
      //     ];
      //   }),
      // );

      for (const [pullRequest, comments] of Object.entries<number>(
        prComments,
      )) {
        const expectedNumberOfComments =
          (comments / threshold) *
          prChurnRatio[pullRequest] *
          prChangeRatio[pullRequest];
        prCommentRatio[pullRequest] = isNaN(expectedNumberOfComments)
          ? 1
          : expectedNumberOfComments;
      }

      this.eventEmitter.emit('kpi.calculated', {
        kpi,
        release,
        since,
        value: prCommentRatio,
      });
    }
  }
}
