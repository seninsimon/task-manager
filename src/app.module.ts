import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost:27017/taskScheduler'),
    UsersModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
