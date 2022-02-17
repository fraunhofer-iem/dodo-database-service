import { Injectable, Logger } from '@nestjs/common';
import { wAvgPerDev } from './model';
import { getIssueLabelQuery } from './lib/issueLabelQueries';
import { RepositoryService } from 'src/entities/repositories/repository.service';
import { RepositoryIdentifier } from 'src/entities/repositories/model';

@Injectable()
export class IssueLabels {
  private readonly logger = new Logger(IssueLabels.name);

  constructor(private readonly repoService: RepositoryService) {}

  /**
   * Computes the weighted avg times (days, weeks, months)
   * for completion for all label categorys of a repository
   * @param repoIdent. It includes the first @param issueLimit
   * issues and only considers devs who are in @param loginFilter.
   */
  async labelPrioritiesAvg(
    repoIdent: RepositoryIdentifier,
    loginFilter?: string[],
    issueLimit?: number,
  ) {
    const lookUpQuery = this.repoService.preAggregate(repoIdent, {
      issues: { labels: true, assignees: true },
    });

    const issueLabelQuery = getIssueLabelQuery(
      lookUpQuery,
      loginFilter,
      issueLimit,
    );

    const dataForWeightedAvg = await issueLabelQuery.exec();

    //console.log(dataForWeightedAvg);

    const wAvg: wAvgPerDev = {};

    computeWeightedAvg();

    this.logger.log(wAvg);

    function computeWeightedAvg() {
      dataForWeightedAvg.forEach((label) => {
        wAvg[label._id] = { daysAvg: 0, weeksAvg: 0, monthsAvg: 0 };
        for (let i = 0; i < label.assignee.length; i++) {
          wAvg[label._id].daysAvg +=
            label.dayAvg[i] * (label.count[i] / label.total);
          wAvg[label._id].weeksAvg +=
            label.weekAvg[i] * (label.count[i] / label.total);
          wAvg[label._id].monthsAvg +=
            label.monthAvg[i] * (label.count[i] / label.total);
        }
      });
    }

    return wAvg;
  }
}
