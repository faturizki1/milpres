import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.use(cookieParser())
  await app.listen(4001)
  console.log('Auth service listening on http://localhost:4001')
}

bootstrap()
