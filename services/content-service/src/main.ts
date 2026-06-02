import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import cookieParser from 'cookie-parser'

async function bootstrap(){
  const app = await NestFactory.create(AppModule)
  app.use(cookieParser())
  const port = process.env.PORT || 4100
  await app.listen(port)
  console.log(`Content service listening on http://localhost:${port}`)
}

bootstrap()
