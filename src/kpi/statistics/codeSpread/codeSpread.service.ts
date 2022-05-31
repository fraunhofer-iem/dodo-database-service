import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sum } from 'lodash';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class CodeSpreadService {
  private readonly logger = new Logger(CodeSpreadService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  @OnEvent('kpi.prepared.locPerFile')
  async locPerFile(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;

    const locPerFile: { [key: string]: number } = {};
    for (const file of release.files) {
      const fileExtension = file.path.split('.').slice(-1)[0];
      let excluded = kpi.params.excludedFileExtensions.includes(fileExtension);
      for (const excludedPath of kpi.params.excludedPaths) {
        if (file.path.startsWith(excludedPath)) {
          excluded = true;
          break;
        }
      }
      if (!excluded) {
        locPerFile[file.path] = Buffer.from(
          file.content as any,
          file.encoding as any,
        )
          .toString()
          .split('\n').length;
      }
    }

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: locPerFile,
    });
  }

  @OnEvent('kpi.prepared.avgLoc')
  async avgLoc(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { locPerFile } = data;

    const avgLoc =
      sum(Object.values(locPerFile)) / Object.values(locPerFile).length;

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: avgLoc,
    });
  }

  @OnEvent('kpi.prepared.totalLoc')
  async totalLoc(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { locPerFile } = data;

    const totalLoc = sum(Object.values(locPerFile));

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: totalLoc,
    });
  }

  @OnEvent('kpi.prepared.stdLoc')
  async stdLoc(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { locPerFile, avgLoc } = data;

    const stdLoc = Math.sqrt(
      sum(
        Object.values(locPerFile).map((loc: number) =>
          Math.pow(loc - avgLoc, 2),
        ),
      ) / Object.values(locPerFile).length,
    );

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: stdLoc,
    });
  }

  @OnEvent('kpi.prepared.codeSpread')
  async codeSpread(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { stdLoc, totalLoc } = data;

    const codeSpread = 1 - (3 * stdLoc) / totalLoc;

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: codeSpread,
    });
  }
}
