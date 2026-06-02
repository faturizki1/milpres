'use client'
import Link from 'next/link'

const sharePlatforms = [
  { name: 'WhatsApp', prefix: 'https://api.whatsapp.com/send?text=' },
  { name: 'Instagram', prefix: 'https://www.instagram.com/' },
  { name: 'Facebook', prefix: 'https://www.facebook.com/sharer/sharer.php?u=' },
  { name: 'X', prefix: 'https://twitter.com/intent/tweet?text=' },
  { name: 'Telegram', prefix: 'https://t.me/share/url?text=' },
  { name: 'Email', prefix: 'mailto:?body=' }
]

export function ArticleShareButtons({ title, url }: { title: string; url: string }) {
  const encoded = encodeURIComponent(`${title} - ${url}`)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {sharePlatforms.map((platform) => (
        <a key={platform.name} className="secondary-button" href={`${platform.prefix}${encoded}`} target="_blank" rel="noreferrer noopener">
          {platform.name}
        </a>
      ))}
      <button className="secondary-button" onClick={() => window.print()}>Print</button>
    </div>
  )
}
