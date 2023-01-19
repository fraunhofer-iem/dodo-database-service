import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { sum } from 'lodash';
import { CalculationEventPayload, transformMapToObject } from '../lib';

@Injectable()
export class CodeSpreadService {
  private readonly logger = new Logger(CodeSpreadService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  @OnEvent('kpi.prepared.locPerFile')
  async locPerFile(payload: CalculationEventPayload) {
    const { kpi, since, release } = payload;
    const params = kpi.params ?? {
      excludedFileExtensions: [],
      excludedPaths: [],
    };

    const locPerFile: Map<string, number> = new Map();
    for (const file of release.files) {
      if (file.encoding !== 'none' && typeof file.encoding !== 'undefined') {
        const fileExtension = file.path.split('.').slice(-1)[0];
        let excluded = params.excludedFileExtensions.includes(fileExtension);
        for (const excludedPath of params.excludedPaths) {
          if (file.path.startsWith(excludedPath)) {
            excluded = true;
            break;
          }
        }
        if (!excluded) {
          locPerFile.set(
            file.path,
            Buffer.from(file.content as any, file.encoding as any)
              .toString()
              .split('\n').length,
          );
        }
      }
      delete file.content;
    }

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: transformMapToObject(locPerFile),
    });
  }

  @OnEvent('kpi.prepared.avgLoc')
  async avgLoc(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { locPerFile } = data;

    const avgLoc =
      sum(Object.values(locPerFile)) / Object.keys(locPerFile).length;

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
    console.log(avgLoc);
    console.log(locPerFile);
    const stdLoc = Math.sqrt(
      sum(
        Object.values(locPerFile).map((loc: number) =>
          Math.pow(loc - avgLoc, 2),
        ),
      ) / Object.keys(locPerFile).length,
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

  @OnEvent('kpi.prepared.codeSpreadTotal')
  async codeSpreadTotal(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    let { codeSpread } = data;
    if (!Array.isArray(codeSpread)) {
      codeSpread = [codeSpread];
    }

    const codeSpreadTotal = codeSpread.reduce((a, b) => a * b);

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: codeSpreadTotal,
    });
  }
}
