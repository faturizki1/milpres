import { Controller, Post, UploadedFile, UseInterceptors, Req, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { MediaService } from './media.service'

@Controller('media')
export class MediaController {
  constructor(private svc: MediaService){}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req:any){
    if(!file) throw new BadRequestException('no_file')
    return this.svc.handleUpload(req.headers['x-tenant-id'] || req.body.tenantId, file)
  }
}
