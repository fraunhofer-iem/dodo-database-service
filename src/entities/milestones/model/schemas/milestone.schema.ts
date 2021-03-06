import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { User } from '../../../users/model/schemas';

/**
 * For further information, see: https://docs.github.com/en/rest/reference/issues#milestones
 */
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
  closed_issues: number;
  @Prop()
  created_at: string;
  @Prop()
  updated_at: string;
  @Prop()
  closed_at: string;
  @Prop()
  due_on: string;

  @Prop({ type: mSchema.Types.Mixed, ref: 'User' })
  creator: User;
}

export type MilestoneDocument = Milestone & Document;

export const MilestoneSchema = SchemaFactory.createForClass(Milestone);
