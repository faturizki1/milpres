import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ContentsModule } from './contents/contents.module'
import { MediaModule } from './media/media.module'
import { SchedulerModule } from './scheduler/scheduler.module'
import { PublicModule } from './public/public.module'
import { SearchModule } from './search/search.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { NotificationsModule } from './notifications/notifications.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ContentsModule,
    MediaModule,
    SchedulerModule,
    PublicModule,
    SearchModule,
    AnalyticsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
