'use strict'

var stampit = require('stampit')
var modbus = require('../..')

var serverPort = 5502

/*
responseDelay is the amount of delay in millisecond for each
response. For a consistenet delay one single numeric value
can be used.

However, if a complex delay is required, then an array can be
used instead with 4 numbers. Where

responseDelay[0] means the value of normal delay.

responseDelay[1] means number of responses to skip before
                 using the special delay. Default is 0,
                 which means do not use special delay.

responseDelay[2] means the value of special delay.
                 Default is 0 ms.

responseDelay[3] means the frequency of using special delay.
                 Default is 0 which means no repeat.

*/

var server = stampit()
  .refs({
    'logEnabled': false,
    'logLevel': 'debug',
    'port': serverPort,
    'responseDelay': [10, 20, 5000, 5],
    'coils': new Buffer(100000),
    'holding': new Buffer(100000),
    'whiteListIPs': [
      '127.0.0.1',
      '192.168.1.1'
    ]
  }).compose(modbus.server.tcp.complete)
  .init(function () {
    var init = function () {
      this.getCoils().writeUInt8(0)

      this.on('readCoilsRequest', function (start, quantity) {
        console.log('readCoilsRequest', start, quantity)
      })

      this.on('readHoldingRegistersRequest', function (start, quantity) {
        console.log('readHoldingRegisters', start, quantity)
      })

      this.on('writeSingleCoilRequest', function (adr, value) {
        console.log('writeSingleCoil', adr, value)
      })

      this.getHolding().writeUInt16BE(1, 0)
      this.getHolding().writeUInt16BE(2, 2)
      this.getHolding().writeUInt16BE(3, 4)
      this.getHolding().writeUInt16BE(4, 6)
      this.getHolding().writeUInt16BE(5, 8)
      this.getHolding().writeUInt16BE(6, 10)
      this.getHolding().writeUInt16BE(7, 12)
      this.getHolding().writeUInt16BE(8, 14)
    }.bind(this)

    init()
  })

server()
console.log('MODBUS Server started at port: ', serverPort)
