import xml2js from 'xml2js'

type Maybe<T> = T | null

export type TestSuites = {
  testsuite?: Maybe<TestSuite[]>
  name?: Maybe<string>
  time?: Maybe<number>
  tests?: Maybe<number>
  failures?: Maybe<number>
  errors?: Maybe<number>
  disabled?: Maybe<number>
}

export type TestCase = {
  name?: Maybe<string>
  classname?: Maybe<string>
  assertions?: Maybe<number>
  time?: Maybe<number>
  status?: Maybe<string>
  skipped?: Maybe<Skipped[]>
  error?: Maybe<Details[]>
  failure?: Maybe<Details[]>
  "system-out"?: Maybe<string[]>
  "system-err"?: Maybe<string[]>
}

export type TestSuite = {
  testcase?: Maybe<TestCase[]>
  name?: Maybe<string>
  tests?: Maybe<number>
  failures?: Maybe<number>
  errors?: Maybe<number>
  time?: Maybe<number>
  disabled?: Maybe<number>
  skipped?: Maybe<number>
  timestamp?: Maybe<string>
  hostname?: Maybe<string>
  id?: Maybe<string>
  package?: Maybe<string>
  properties?: Maybe<Property[]>
  "system-out"?: Maybe<string[]>
  "system-err"?: Maybe<string[]>
}

export type Property = { name?: Maybe<string>, value?: Maybe<string> }
export type Skipped = { message?: Maybe<string> }
export type Details = { message?: Maybe<string>, type?: Maybe<string>, inner?: Maybe<string> }

export const parse = async (xmlString: xml2js.convertableToString, xml2jsOptions?: xml2js.OptionsV2): Promise<TestSuites|TestSuite|undefined|null> => {
  const options = xml2jsOptions ?? {
    attrValueProcessors: [xml2js.processors.parseNumbers]
  }
  const result = await xml2js.parseStringPromise(xmlString, options)
  if (result === null) return null

  if ('testsuites' in result) {
    return _parse(result['testsuites']) as Promise<TestSuites>
  }
  else if('testsuite' in result) {
    return _parse(result['testsuite']) as Promise<TestSuite>
  }
}

type ObjOrArray = {[key: string]: any } | Array<ObjOrArray>
const _parse = (objOrArray: ObjOrArray): ObjOrArray => {
  if (Array.isArray(objOrArray)) {
    return objOrArray.map((_obj: ObjOrArray) => {
      // 中身がさらにネストされた配列 or $キーのobjectなら再起
      if (Array.isArray(_obj) || typeof(_obj) === 'object') {
        return _parse(_obj)
      }
      // 配列の中身が単なる文字列ならinnerキーを自分で付けてobjectで返す
      return { inner: _obj }
    })
  }
  let output: {[key: string]: any} = {}
  Object.keys(objOrArray).forEach((key) => {
    const nested = objOrArray[key]
    if (key === '$') {
      output = { ...output, ..._parse(nested) }
    }
    else if (key === 'system-out' || key === 'system-err') {
      output[key] = nested.map((inner: string) => inner)
    }
    else if (typeof(nested) === 'object') {
      output[key] = _parse(nested)
    }
    else if (key === '_') {
      output['inner'] = nested
    }
    else {
      output[key] = nested
    }
  })
  return output
}
