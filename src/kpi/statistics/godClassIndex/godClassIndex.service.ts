import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { max } from 'lodash';
import { CalculationEventPayload } from '../lib';

@Injectable()
export class GodClassIndexService {
  private readonly logger = new Logger(GodClassIndexService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  @OnEvent('kpi.prepared.locRatioPerFile')
  async locRatioPerFile(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { locPerFile, totalLoc } = data;

    const locRatioPerFile: { [key: string]: number } = {};

    for (const [file, loc] of Object.entries<number>(locPerFile)) {
      locRatioPerFile[file] = loc / totalLoc;
    }

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: locRatioPerFile,
    });
  }

  @OnEvent('kpi.prepared.godClassIndex')
  async godClassIndex(payload: CalculationEventPayload) {
    const { kpi, since, release, data } = payload;
    const { locRatioPerFile } = data;

    const godClassIndex = 1 - max<number>(Object.values(locRatioPerFile));

    this.eventEmitter.emit('kpi.calculated', {
      kpi,
      release,
      since,
      value: godClassIndex,
    });
  }
}
