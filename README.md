# Deviceful.js

Command devices for your designs.

[Get started over at deviceful.app](https://deviceful.app/)

## Changelog

**Current Version – v0.9.4**

Features:

- React users can now pass a ref.current into the mount method inside useEffect, see the starter below for details

- You can change the path Deviceful will look for the assets using the new 'path' parameter. Default is "./public"

**v0.9.2**

Performance improvements:

- Each Deviceful will run only when its about to appear inside the viewport, and pauses when it leaves. This should speed up pages that have multiple instances of Deviceful running at once.

- Device Pixel Ratio is limited to a maximum of 2, some mobiles can have a DPR of up to 5

**v0.9**

Here's the first beta version available. I expect a few issues to come through so let me know if you run into anything, I'll iron out some unexpected bugs before launching **v1**.

## Starters

**static example**
https://github.com/kylewetton/deviceful-starter-dist

**npm example**
https://github.com/kylewetton/deviceful-starter-npm

**React example**
[https://github.com/kylewetton/deviceful-starter-react](https://github.com/kylewetton/deviceful-starter-react)
