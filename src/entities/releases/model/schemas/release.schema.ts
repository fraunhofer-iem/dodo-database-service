import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { Repository } from 'src/entities/repositories/model/schemas';

/**
 * For further information, see: https://docs.github.com/en/rest/reference/releases
 */
@Schema()
export class Release {
  @Prop()
  url: string;

  @Prop()
  id: number;

  @Prop()
  node_id: string;

  @Prop()
  name: string;

  @Prop()
  created_at: string;

  @Prop()
  published_at: string;

  @Prop({ type: mSchema.Types.Mixed, ref: 'Repo' })
  repo: Repository;
}

export type ReleaseDocument = Release & Document;

export const ReleaseSchema = SchemaFactory.createForClass(Release);
