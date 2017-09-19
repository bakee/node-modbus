'use strict'

var stampit = require('stampit')

module.exports = stampit()
  .init(function () {
    var init = function () {
      this.log.debug('initiating read holding registers request handler.')

      if (Array.isArray(this.responseDelay)) {
        this.responseDelay = this.responseDelay.concat([0, 0, 0, 0])
        this.responseDelay.length = 4
      } else if (!Number.isNaN(this.responseDelay)) {
        this.responseDelay = [Number(this.responseDelay), 0, 0, 0]
      } else {
        this.responseDelay = [0, 0, 0, 0]
      }

      if (Number.isNaN(this.responseDelay[0])) {
        this.normalDelay = 0
      } else {
        this.normalDelay = this.responseDelay[0]
      }

      if (Number.isNaN(this.responseDelay[1])) {
        this.specialDelayAfter = 0
      } else {
        this.specialDelayAfter = this.responseDelay[1]
      }

      if (Number.isNaN(this.responseDelay[2])) {
        this.specialDelay = 0
      } else {
        this.specialDelay = this.responseDelay[2]
      }

      if (Number.isNaN(this.responseDelay[3])) {
        this.specialDelayRepeatInterval = 0
      } else {
        this.specialDelayRepeatInterval = this.responseDelay[3]
      }

      this.setRequestHandler(3, onRequest)
    }.bind(this)

    this.currentResponseNo = 0

    this.getDelayAmount = function (responseNumber) {
      if (this.specialDelayAfter === 0 || responseNumber < this.specialDelayAfter) {
        return this.normalDelay
      }

      if (responseNumber === this.specialDelayAfter) {
        return this.specialDelay
      }

      if (this.specialDelayRepeatInterval > 0) {
        if ((responseNumber - this.specialDelayAfter) % this.specialDelayRepeatInterval === 0) {
          return this.specialDelay
        }
      }

      return this.normalDelay
    }

    var onRequest = function (pdu, cb) {
      setTimeout(function () {
        this.log.debug('handling read holding registers request.')

        if (pdu.length !== 5) {
          this.log.debug('wrong pdu length.')

          let buf = Buffer.allocUnsafe(2)

          buf.writeUInt8(0x83, 0)
          buf.writeUInt8(0x02, 1)
          cb(buf)

          return
        }

        var start = pdu.readUInt16BE(1)
        var byteStart = start * 2
        var quantity = pdu.readUInt16BE(3)

        this.emit('readHoldingRegistersRequest', byteStart, quantity)

        var mem = this.getHolding()

        if (byteStart > mem.length || byteStart + (quantity * 2) > mem.length) {
          this.log.debug('request outside register boundaries.')
          let buf = Buffer.allocUnsafe(2)

          buf.writeUInt8(0x83, 0)
          buf.writeUInt8(0x02, 1)
          cb(buf)
          return
        }

        var head = Buffer.allocUnsafe(2)

        head.writeUInt8(0x03, 0)
        head.writeUInt8(quantity * 2, 1)

        var response = Buffer.concat([head, mem.slice(byteStart, byteStart + quantity * 2)])

        this.log.debug('finished read holding register request.')

        cb(response)
      }.bind(this), (this.getDelayAmount(this.currentResponseNo++)))
    }.bind(this)

    init()
  })
