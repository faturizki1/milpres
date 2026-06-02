import { Module, MiddlewareConsumer } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { TenantsModule } from './tenants/tenants.module'
import { TenantContextMiddleware } from './common/tenant-context.middleware'

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 900, // 15 minutes window
      limit: 100, // per IP default (login uses custom guard)
    }),
    AuthModule,
    UsersModule,
    TenantsModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*')
  }
}
