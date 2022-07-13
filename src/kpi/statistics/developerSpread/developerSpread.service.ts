import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sumBy } from 'lodash';
import { CommitService } from 'src/entities/commits/commit.service';
import { RepositoryService } from '../../../entities/repositories/repository.service';
import { CalculationEventPayload } from '../../statistics/lib';

@Injectable()
export class DeveloperSpreadService {
  private readonly logger = new Logger(DeveloperSpreadService.name);

  constructor(
    private readonly repoService: RepositoryService,
    private readonly commitService: CommitService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('kpi.prepared.devSpread')
  public async devSpread(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;
    const devs = (
      await this.commitService
        .preAggregate(
          { repo: (release.repo as any)._id },
          { author: true, since: since, to: release.published_at },
        )
        .match({
          'author.type': 'User', // filter Bots
        })
        .group({
          _id: null,
          logins: { $addToSet: '$author.login' },
        })
        .exec()
    )[0];

    const devsToRepos = await this.commitService
      .preAggregate(
        {},
        { author: true, repo: true, since: since, to: release.published_at },
      )
      .match({
        'repo.owner': release.repo.owner,
      })
      .match({
        'author.login': { $in: devs.logins },
      })
      .group({
        _id: '$author.login',
        repos: { $addToSet: { $concat: ['$repo.owner', '/', '$repo.repo'] } },
      })
      .exec();

    const devSpread = Object.fromEntries(
      devsToRepos.map((entry) => [entry._id, entry.repos]),
    );
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: devSpread,
    });
  }

  @OnEvent('kpi.prepared.unsharedAttention')
  public async unsharedAttention(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    let { devSpread } = data;

    const attentionMap: { [key: string]: Set<string> } = {};

    if (!Array.isArray(devSpread)) {
      devSpread = [devSpread];
    }
    for (const element of devSpread) {
      for (const [login, repos] of Object.entries(element)) {
        if (!attentionMap.hasOwnProperty(login)) {
          attentionMap[login] = new Set();
        }
        (repos as string[]).forEach((repo) => attentionMap[login].add(repo));
      }
    }

    const avgSpread =
      sumBy(Object.values(attentionMap), (repos) => repos.size) /
      Object.keys(attentionMap).length;
    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: 1 / avgSpread,
    });
  }
}
