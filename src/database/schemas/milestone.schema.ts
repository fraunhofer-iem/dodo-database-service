import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Milestone {
  @Prop()
  id: number;
  @Prop()
  node_id: string;
  @Prop()
  number: number;
  @Prop()
  state: string;
  @Prop()
  title: string;
  @Prop()
  description: string;
  @Prop()
  open_issues: number;
  @Prop()
  closed_issues: string;
  @Prop()
  created_at: string;
  @Prop()
  updated_at: string;
  @Prop()
  closed_at: string;
  @Prop()
  due_on: string;
  // @Prop({ type: mSchema.Types.ObjectId, ref: 'Creator' })
  // creator: Creator;
}
export type MilestoneDocument = Milestone & Document;
export const MilestoneSchema = SchemaFactory.createForClass(Milestone);
