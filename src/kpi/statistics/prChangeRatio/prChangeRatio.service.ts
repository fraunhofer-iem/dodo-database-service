import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class PrChangeRatioService {
  private readonly logger = new Logger(PrChangeRatioService.name);

  constructor(
    private repoService: RepositoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.prepared.prChangeRatio')
  public async prChangeRatio(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;

    const diffs = await this.repoService
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
      .exec();

    const prChangeRatio: { [key: string]: number } = Object.fromEntries(
      diffs.map((diff) => {
        return [
          diff.pullRequest.url,
          diff.files.length / diff.repositoryFiles.length,
        ];
      }),
    );
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: prChangeRatio,
    });
  }
}
