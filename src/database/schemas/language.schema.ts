import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { Repository } from './repository.schema';
import { Language } from 'src/github-api/model/PullRequest';

@Schema()
export class Languages {
    @Prop({ type: mSchema.Types.ObjectId, ref: 'repo' })
    repo: Repository;
    
    @Prop({type: Object})
    languages: Language;
}

export type LanguageDocument = Languages & Document;

export const LanguageSchema = SchemaFactory.createForClass(Languages);