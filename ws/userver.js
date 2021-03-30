/* Non-SSL is simply App() */
require('uWebSockets.js').SSLApp({

  /* There are more SSL options, cut for brevity */
  key_file_name: 'misc/key.pem',
  cert_file_name: 'misc/cert.pem',
  
}).ws('/*', {

  /* There are many common helper features */
  idleTimeout: 30,
  maxBackpressure: 1024,
  maxPayloadLength: 512,
  compression: DEDICATED_COMPRESSOR_3KB,

  /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
  message: (ws, message, isBinary) => {
    /* You can do app.publish('sensors/home/temperature', '22C') kind of pub/sub as well */
    
    /* Here we echo the message back, using compression if available */
    let ok = ws.send(message, isBinary, true);
  }
  
}).get('/*', (res, req) => {

  /* It does Http as well */
  res.writeStatus('200 OK').writeHeader('IsExample', 'Yes').end('Hello there!');
  
}).listen(9001, (listenSocket) => {

  if (listenSocket) {
    console.log('Listening to port 9001');
  }
  
});