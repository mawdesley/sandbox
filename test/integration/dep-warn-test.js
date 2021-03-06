let test = require('tape')
let { join } = require('path')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let tiny = require('tiny-json-http')
let { url, shutdown } = require('./http/_utils')

let cwd = process.cwd()
let mock = join(__dirname, '..', 'mock', 'dep-warn')
let instructions = str => str.match(/Please run:/g).length

let stdout = process.stdout.write
let data = ''

function setup () {
  process.stdout.write = write => {
    data += write
  }
}

function teardown () {
  process.stdout.write = stdout
}

function reset () {
  data = ''
}

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'got sandbox')
})

test('[Dependency warnings (basic)] Start Sandbox', t => {
  t.plan(4)
  process.chdir(join(mock, 'basic'))
  sandbox.start({}, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[Dependency warnings (basic)] Lambda has its own deps', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/deps-in-lambda'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      console.log(data)
      t.ok(data.includes(`Please run: cd ${join(process.cwd(), 'src', 'http', 'get-deps_in_lambda')}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
      t.notOk(data.includes('lambda-dep'), 'Did not get dep warning for a Lambda dep')
      t.ok(data.includes('root-dep'), 'Got a dep warning for a root dep')
      t.ok(data.includes('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 1, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (basic)] Deps are in root', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/deps-in-root'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      console.log(data)
      t.notOk(data.includes(join(process.cwd(), 'src', 'http', 'get-deps_in_root')), 'Got a dep warning for the root (with instructions to install into the root)')
      t.ok(data.includes('Please run: npm i'), 'Got instructions to install into the root')
      t.notOk(data.includes('root-dep'), 'Got a dep warning for a root dep')
      t.ok(data.includes('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 1, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (basic)] Deps are in shared', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/deps-in-shared'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      console.log(data)
      t.notOk(data.includes(join(process.cwd(), 'src', 'http', 'get-deps_in_shared')), 'Got a dep warning for the shared (with instructions to install into the shared)')
      t.ok(data.includes('Please run: npm i'), 'Got instructions to install into the shared')
      t.notOk(data.includes('root-dep'), 'Got a dep warning for a root dep')
      t.ok(data.includes('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 1, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (basic)] Deps found', t => {
  t.plan(1)
  setup()
  tiny.get({
    url: url + '/deps-found'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      t.equal(data, '', 'No warnings issued when all deps are found uniformly')
      reset()
    }
  })
})

test('[Dependency warnings (basic)] Deps missing', t => {
  t.plan(1)
  tiny.get({
    url: url + '/deps-missing'
  }, function _got (err) {
    if (err) t.ok(err, 'Got a failure')
    else t.fail('Expected an error')
  })
})

test('[Dependency warnings (basic)] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test('[Dependency warnings (shared - no packages)] Start Sandbox', t => {
  t.plan(4)
  process.chdir(join(mock, 'no-packages'))
  sandbox.start({}, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[Dependency warnings (shared - no packages)] Shared deps', t => {
  t.plan(1)
  setup()
  tiny.get({
    url: url + '/shared'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      console.log(data)
      t.notOk(data.includes('root-dep'), 'Did not get a dep warning')
      reset()
    }
  })
})

test('[Dependency warnings (shared - no packages)] Views deps', t => {
  t.plan(1)
  setup()
  tiny.get({
    url: url + '/views'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      console.log(data)
      t.notOk(data.includes('root-dep'), 'Did not get a dep warning')
      reset()
    }
  })
})

test('[Dependency warnings (shared - no packages)] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test('[Dependency warnings (shared - packages in shared)] Start Sandbox', t => {
  t.plan(4)
  process.chdir(join(mock, 'shared-packages'))
  sandbox.start({}, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[Dependency warnings (shared - packages in shared)] Missing shared deps loaded from root', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/shared'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      console.log(data)
      t.ok(data.includes(`Please run: cd ${join(process.cwd(), 'src', 'shared')}`), 'Got a dep warning on the correct Lambda (with instructions to install deps into src/shared)')
      t.notOk(data.includes('lambda-dep'), 'Did not get dep warning for a Lambda dep')
      t.ok(data.includes('root-dep'), 'Got a dep warning for a root dep')
      t.ok(data.includes('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 2, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (shared - packages in shared)] Missing views deps loaded from root', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/views'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      console.log(data)
      t.ok(data.includes(`Please run: cd ${join(process.cwd(), 'src', 'views')}`), 'Got a dep warning on the correct Lambda (with instructions to install deps into src/views)')
      t.notOk(data.includes('lambda-dep'), 'Did not get dep warning for a Lambda dep')
      t.ok(data.includes('root-dep'), 'Got a dep warning for a root dep')
      t.ok(data.includes('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 2, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (shared - packages in shared)] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test('[Dependency warnings (shared - packages in Lambdas)] Start Sandbox', t => {
  t.plan(4)
  process.chdir(join(mock, 'lambda-packages'))
  sandbox.start({}, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[Dependency warnings (shared - packages in Lambdas)] Missing shared deps loaded from root', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/shared'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      console.log(data)
      t.ok(data.includes(`Please run: cd ${join(process.cwd(), 'src', 'http', 'get-shared')}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
      t.notOk(data.includes('lambda-dep'), 'Did not get dep warning for a Lambda dep')
      t.ok(data.includes('root-dep'), 'Got a dep warning for a root dep')
      t.ok(data.includes('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 1, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (shared - packages in Lambdas)] Missing views deps loaded from root', t => {
  t.plan(5)
  setup()
  tiny.get({
    url: url + '/views'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      console.log(data)
      t.ok(data.includes(`Please run: cd ${join(process.cwd(), 'src', 'http', 'get-views')}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
      t.notOk(data.includes('lambda-dep'), 'Did not get dep warning for a Lambda dep')
      t.ok(data.includes('root-dep'), 'Got a dep warning for a root dep')
      t.ok(data.includes('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 1, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (shared - packages in Lambdas)] Shut down Sandbox', t => {
  t.plan(1)
  shutdown(t)
})

test('[Dependency warnings (shared - packages in shared + Lambdas)] Start Sandbox', t => {
  t.plan(4)
  process.chdir(join(mock, 'all-packages'))
  sandbox.start({}, function (err, result) {
    if (err) t.fail(err)
    else {
      t.notOk(process.env.DEPRECATED, 'Arc v5 deprecated status NOT set')
      t.equal(process.env.ARC_API_TYPE, 'http', 'API type set to http')
      t.equal(process.env.ARC_HTTP, 'aws_proxy', 'aws_proxy mode enabled')
      t.equal(result, 'Sandbox successfully started', 'Sandbox started')
    }
  })
})

test('[Dependency warnings (shared - packages in shared + Lambdas)] Missing shared deps loaded from root', t => {
  t.plan(6)
  setup()
  tiny.get({
    url: url + '/shared'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      console.log(data)
      t.ok(data.includes(`Please run: cd ${join(process.cwd(), 'src', 'http', 'get-shared')}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
      t.ok(data.includes(`Please run: cd ${join(process.cwd(), 'src', 'shared')}`), 'Got a dep warning on the correct Lambda (with instructions to install deps into src/shared)')
      t.notOk(data.includes('lambda-dep'), 'Did not get dep warning for a Lambda dep')
      t.ok(data.includes('another-root-dep'), 'Got a dep warning for a root dep')
      t.ok(data.includes('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 2, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings (shared - packages in shared + Lambdas)] Missing views deps loaded from root', t => {
  t.plan(6)
  setup()
  tiny.get({
    url: url + '/views'
  }, function _got (err) {
    teardown()
    if (err) t.fail(err)
    else {
      console.log(data)
      t.ok(data.includes(`Please run: cd ${join(process.cwd(), 'src', 'http', 'get-views')}`), 'Got a dep warning on the correct Lambda (with instructions to install into the Lambda)')
      t.ok(data.includes(`Please run: cd ${join(process.cwd(), 'src', 'views')}`), 'Got a dep warning on the correct Lambda (with instructions to install deps into src/views)')
      t.notOk(data.includes('lambda-dep'), 'Did not get dep warning for a Lambda dep')
      t.ok(data.includes('another-root-dep'), 'Got a dep warning for a root dep')
      t.ok(data.includes('@architect/inventory'), 'Got a dep warning for an out of band dep')
      t.equal(instructions(data), 2, 'Got correct number of dep warnings')
      reset()
    }
  })
})

test('[Dependency warnings] Teardown', t => {
  t.plan(3)
  shutdown(t)
  delete process.env.ARC_API_TYPE
  process.chdir(cwd)
  t.notOk(process.env.ARC_API_TYPE, 'API type NOT set')
  t.equal(process.cwd(), cwd, 'Switched back to original working dir')
})
