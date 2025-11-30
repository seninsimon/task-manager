import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  body: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Object, default: {} })
  data: any;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
