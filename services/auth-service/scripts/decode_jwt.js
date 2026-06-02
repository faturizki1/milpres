const fs = require('fs')
function b64UrlDecode(input){
  input = input.replace(/-/g, '+').replace(/_/g, '/')
  while(input.length % 4) input += '='
  return Buffer.from(input, 'base64').toString('utf8')
}
try{
  const data = JSON.parse(fs.readFileSync('/tmp/auth_login_resp.json','utf8'))
  const token = data.access_token
  if(!token){ console.log('no access_token'); process.exit(0) }
  const parts = token.split('.')
  if(parts.length<2){ console.log('invalid token format'); process.exit(1) }
  const payload = b64UrlDecode(parts[1])
  console.log('access_token:', token)
  console.log('\n--- decoded JWT payload ---')
  console.log(payload)
}catch(e){ console.error('decode error', e) }
