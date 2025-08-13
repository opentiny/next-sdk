# QrCode 引入二维码

通过引入 `QrCodeModal` 方法自动生成二维码。

## 引入方式

```js
import { QrCodeModal } from '@opentiny/next-sdk'

const qrCodeEl = new QrCodeModal()

// 打开二维码
qrCodeEl.open(url)
```