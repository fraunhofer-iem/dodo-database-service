import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { KpiTypeService } from './kpiType.service';
import { KpiTypeCreate } from './model';
import { KpiType } from './model/schemas';

@Controller('api/kpis/types')
export class KpiTypeController {
  private readonly logger = new Logger(KpiTypeController.name);

  constructor(private kpiTypeService: KpiTypeService) {}

  @Get()
  async readKpiTypes() {
    const pipeline = this.kpiTypeService.preAggregate();
    const kpiTypes = await pipeline.exec();
    return kpiTypes;
  }

  @Get(':kpiTypeId')
  async readKpiType(@Param('kpiTypeId') kpiTypeId: string) {
    const pipeline = this.kpiTypeService.preAggregate({ id: kpiTypeId });
    const kpiType = await pipeline.exec();
    if (kpiType.length) {
      return kpiType[0];
    } else {
      return null;
    }
  }

  @Post()
  async createKpiType(@Body() kpiType: KpiTypeCreate) {
    try {
      const children: KpiType[] = [];
      for (const childId of kpiType.children) {
        const child = await this.kpiTypeService.read({ id: childId });
        children.push(child._id);
      }
      await this.kpiTypeService.create({
        ...kpiType,
        children,
      });
      return await this.readKpiType(kpiType.id);
    } catch (err) {
      return err.message;
    }
  }
}
