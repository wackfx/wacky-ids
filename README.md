# Short Unique ID (UUID) - @wackfx edition
Heavily inspired (with chunks of codes from) [short-unique-id by jeanlescure](https://github.com/jeanlescure/short-unique-id).

Rewritten to be compatible with Cloudflare workers - no dependencies - only pure JS.

---

## Use it

```javascript
import ShortUUID from 'wacky-ids'
const UUID = ShortUUID({ dictionary: 'alphanum' })
console.log(UUID.randomUUID()) // by default - random 6 uuid
console.log(UUID.randomUUID(10))
```
