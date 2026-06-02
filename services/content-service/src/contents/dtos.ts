export class CreateContentDto {
  title: string
  body: string
  scheduledAt?: string | null
  tags?: string[]
}

export class UpdateContentDto {
  title?: string
  body?: string
  scheduledAt?: string | null
  status?: string
}
