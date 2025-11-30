import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  hashedRefreshToken: string;

  // new:
  @Prop({ type: Types.ObjectId, ref: "Company", default: null })
  company: Types.ObjectId | null;

  @Prop({
    type: String,
    enum: ["owner", "senior", "developer"],
    default: "developer",
  })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
