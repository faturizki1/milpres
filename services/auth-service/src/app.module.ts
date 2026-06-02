import { Module, MiddlewareConsumer } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { TenantsModule } from './tenants/tenants.module'
import { TenantContextMiddleware } from './common/tenant-context.middleware'

@Module({
  imports: [
    // Throttler removed; login-throttling implemented via Redis in AuthService
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
