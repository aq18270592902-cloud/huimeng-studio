
const B='https://api.dimnx.com/api';
const T='eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOjIxMTk2NDQzMTY2NTUwNzk0MjYsInJuU3RyIjoiRDlMSjdER0h2OWFRT2V5dEZFcUpqN2N6NENhSVlRN2UiLCJpcCI6IjE4My4yMTguMzYuMTczIiwiYWRkcmVzcyI6IuS4reWbvXzmsZ_opb_nnIF85a6c5pil5biCfOenu-WKqCIsImJyb3dzZXIiOiJDaHJvbWUgMTQwIiwib3MiOiJVbmtub3duIiwibG9naW5UaW1lIjoxNzk0MTk3OTA0fQ.93wIBQY-nNKWQo44B0qiXLprBwjRBfKSscycDxdpKRE';
const H={authorization:'Bearer '+T,'x-tenant-id':'2119644316638302210','x-tenant-code':'THtf7Yx14fgV','content-type':'application/json'};
(async()=>{
  try{
    const r=await fetch(B+'/billing/points',{headers:H});
    console.log('points',r.status,(await r.text()).slice(0,200));
  }catch(e){console.log('points ERR',e.message)}
  try{
    const r=await fetch(B+'/styles/image/prepare',{method:'POST',headers:H,body:JSON.stringify({fileName:'a.png',contentType:'image/png'})});
    console.log('prepare',r.status,(await r.text()).slice(0,300));
  }catch(e){console.log('prepare ERR',e.message)}
})();
