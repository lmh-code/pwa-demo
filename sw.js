const CACHE_NAME='pwa-demo'

// const runtimeCaching = [
//   {
//     urlPattern: /^https:\/\/ics-api-sit\.longfor\.com\/.*/i,
//     handler: 'NetworkFirst',
//     cacheName: 'dmp-api-cache',
//   }
// ]

const needCached = [
  './manifest.webmanifest',
  './',
  './js/resize.js',
  './index.css',
  './image/top-banner.webp',
  './icon/'
  
  // 'https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/46d108b60511497a9ec4115ffb1ed29d~tplv-k3u1fbpfcp-watermark.image'
]

// install中可以做：用来填充你的浏览器的离线缓存能力
this.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      cache.addAll(needCached)
    }).catch((error) => {
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
async function cacheFirst(req) {
  try {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(req)
    if(cached) {
      return cached
    }else {
      const fresh = await fetch(req)
      return fresh
    }
  }catch(error) {
    console.log('caches.open error:', error)
  }
}

/**
 * @description: 网络优先
 */
async function networkFirst(req) {
  try {
    const fresh = await fetch(req)
    return fresh
  }catch(error) {
    console.log('fetch error:', error)
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(req)
    return cached
  }
}

// fetch中可以做：缓存或者读取网络资源
this.addEventListener('fetch', function(event) {
  const req = event.request
  console.log('req:', req, event);
  event.respondWith(cacheFirst(req))
})