// 求1-10亿的数字的和
this.addEventListener('message', function(e) {
  if(e.data === 'GET_SUM_TOTAL') {
    let sum = 0
    for(let i = 0; i < 1000000000; i++) {
      sum+=i
    }
    this.postMessage({
      key: 'GET_SUM_TOTAL',
      total: sum
    })
  }
}, false)



