// Testing Pure Functions

import cases from 'jest-in-case'
import {isPasswordAllowed} from '../auth'

const casify = (testSuite) => {
  return Object.entries(testSuite).map(([name, password]) => ({
    name: `${password} - ${name}`,
    password,
  }))
}

describe('isPasswordAllowed', () => {
  cases(
    'valid passwords',
    (options) => {
      expect(isPasswordAllowed(options.password)).toBe(true)
    },
    casify({
      'valid password': '!aBc123',
    }),
  )

  cases(
    'invalid passwords',
    (options) => {
      expect(isPasswordAllowed(options.password)).toBe(false)
    },
    casify({
      'too short': 'a2c!',
      'no letters': '12345,6!',
      'no numbers': 'ABCdef!',
      'no uppercase letters': 'abc123!',
      'no lowercase letters': 'ABC123!',
      'no non-alphanumeric characters': 'ABCdef123',
    }),
  )
})
