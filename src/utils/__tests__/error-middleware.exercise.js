// Testing Middleware

import {UnauthorizedError} from 'express-jwt'
import {buildRes, buildReq, buildNext} from 'utils/generate'
import errorMiddleware from '../error-middleware'

// function buildRes(overrides) {
//   const res = {
//     json: jest.fn(() => res),
//     status: jest.fn(() => res),
//     ...overrides,
//   }
//   return res
// }

// 🐨 Write a test for the UnauthorizedError case
describe('errorMiddleWare', () => {
  it('response with 401 for express-jwt UnauthorizedError', () => {
    const code = 'some_error_code'
    const message = 'Some message'
    const error = new UnauthorizedError(code, {
      message,
    })
    const res = buildRes()
    const req = buildReq()
    const next = buildNext()

    errorMiddleware(error, req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.status).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      code: error.code,
      message: error.message,
    })
    expect(res.json).toHaveBeenCalledTimes(1)
  })

  it('calls next if headersSent true', () => {
    const error = new Error('blah')
    const res = buildRes({
      headersSent: true,
    })
    const req = buildReq()
    const next = buildNext()

    errorMiddleware(error, req, res, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  it('response with 500 and the error object', () => {
    const message = 'blah'
    const error = new Error(message)
    const res = buildRes()
    const req = buildReq()
    const next = buildNext()

    errorMiddleware(error, req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.status).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      message: error.message,
      stack: error.stack,
    })
    expect(res.json).toHaveBeenCalledTimes(1)
  })
})
