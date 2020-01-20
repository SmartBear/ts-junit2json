import xml2js from 'xml2js'

export type TestSuiteReport = {
  name?: string
  time?: number
  suites: TestSuite[]
}

export type TestSuites = {
  testsuite: TestSuite[]
  name?: string
  time?: number
  tests?: number
  failures?: number
  error?: number
  disabled?: number
}

export type TestSuite = {
  testcase: TestCase[]
  name: string
  tests: number
  failures?: number
  errors?: number
  time?: number
  disabled?: number
  skipped?: number
  timestamp?: string
  hostname?: string
  id?: string
  package?: string
  properties?: Array< {name: string, value: string } >
  "system-out"?: string[]
  "system-err"?: string[]
}

export type TestCase = {
  name: string
  classname: string
  assertions?: number
  time?: number
  status?: string
  skipped?: Array<{ message: string }>
  error?: Array<{ message: string, type?: string }>
  failure?: Array<{ message: string, type?: string }>
  "system-out"?: string[]
  "system-err"?: string[]
}

export const parse = async (xmlString: xml2js.convertableToString) => {
  const result = await xml2js.parseStringPromise(xmlString, {
    attrValueProcessors: [xml2js.processors.parseNumbers]
  })
  const rawTestsuites = result['testsuites']
  const output = { ...rawTestsuites['$'] }

  const testsuiteList = []
  for (const rawTestsuite of rawTestsuites['testsuite']) {
    const testsuite = { ...rawTestsuite['$'] }

    const testcaseList = []
    for (const rawTestcase of rawTestsuite['testcase']) {
      const testcase = { ...rawTestcase['$'] }
      // TODO: キーの中身を見て$、_、配列であれば展開するように一般化できるはず
      const rawFailure = rawTestcase['failure']
      if (rawFailure) {
        const failureList = []
        for (const rawFailure of rawTestcase['failure']) {
          let failure = {}
          if (typeof rawFailure === 'object') {
            failure = { ...rawFailure['$'] }
            if (rawFailure['_']) {
              failure = { ...failure, body: rawFailure['_'] }
            }
          }
          // attributeが何も存在しない場合、$や_は存在せずにstring型でタグの中身が文字列として入っている
          else {
            failure = { body: rawFailure }
          }
        failureList.push(failure)
        }
        testcase['failure'] = failureList
      }

      testcaseList.push(testcase)
    }
    testsuite['testcase'] = testcaseList
    testsuiteList.push(testsuite)
  }
  output['testsuite'] = testsuiteList

  return output
}