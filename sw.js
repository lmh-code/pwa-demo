const _toString = Object.prototype.toString;
function isRegExp(v) {
  return _toString.call(v) === '[object RegExp]';
}

const scope = this.registration.scope
const defaultCaching = {
  urlPattern: [
    `${scope}manifest.webmanifest`,
    `${scope}js/resize.js`,
    `${scope}index.css`,
    `${scope}image/top-banner.webp`,
    `${scope}icon/`
  ],
  handler: 'CacheFirst',
  cacheName: 'pwa-static-cache',
}

/**
 * @description: 可以配置runtimeCaching缓存更多内容
 * @return {
 *  urlPattern: 正则表达式
 *  handler: NetworkFirst | CacheFirst， 表示 网络优先 | 缓存优先
 *  cacheName: 缓存的key
 * }
 */
const runtimeCaching = [
  {
    urlPattern: scope,
    handler: 'NetworkFirst',
    cacheName: 'pwa-static-cache',
  },
  {
    urlPattern: /^https:\/\/p(|\d+)-juejin\.byteimg\.com\/.*/i,
    handler: 'NetworkFirst',
    cacheName: 'pwa-article-image',
  }
]

// install中可以做：用来填充你的浏览器的离线缓存能力
this.addEventListener('install', (event) => {
  // 将需要默认缓存的内容做一次缓存
  event.waitUntil(
    caches.open(defaultCaching.cacheName).then(cache => {
      cache.addAll(defaultCaching.urlPattern)
    }).catch(error => {
      console.log('caches.open error:', error)
    })
  )

  // 跳过等待
  event.waitUntil(self.skipWaiting())
})

// activate中可以做：清理先前版本的 service worker 脚本中使用的资源
this.addEventListener('activate', function(event) {
  console.log('activate:', event)
  self.clients.claim() // 将自己设置为其范围内所有客户端的控制器
})

/**
 * @description: 缓存优先
 */
async function cacheFirst(req, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(req)
    if(cached) {
      return cached
    }else {
      const fresh = await fetch(req)
      // 把响应的备份存储在缓存中
      await cache.put(req, fresh.clone())
      return fresh
    }
  }catch(error) {
    console.log('caches.open error:', error)
  }
}

/**
 * @description: 网络优先
 */
async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const fresh = await fetch(req)
    // 把响应的备份存储在缓存中
    await cache.put(req, fresh.clone())
    return fresh
  }catch(error) {
    console.log('fetch error:', error)
    const cached = await cache.match(req)
    return cached
  }
}

// fetch中可以做：缓存或者读取网络资源
this.addEventListener('fetch', function(event) {
  const url = event.request.url
  const option = runtimeCaching.find(cache => (
    (cache.urlPattern && typeof cache.urlPattern === 'string' && cache.urlPattern.includes(url)) || (cache.urlPattern && isRegExp(cache.urlPattern) && cache.urlPattern.test(url))
  ))

  const req = event.request
  if(option) {
    if(option.handler === 'CacheFirst') {
      event.respondWith(cacheFirst(req, option.cacheName))
    }else {
      event.respondWith(networkFirst(req, option.cacheName))
    }
  }else { 
    // 没有和runtimeCaching规则匹配的，处理一些默认规则
    if(defaultCaching.handler === 'CacheFirst') {
      event.respondWith(cacheFirst(req, defaultCaching.cacheName))
    }else {
      event.respondWith(networkFirst(req, defaultCaching.cacheName))
    }
  }
})