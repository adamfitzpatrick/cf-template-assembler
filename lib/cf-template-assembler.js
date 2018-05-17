const path = require('path')
const fs = require('fs')
const yamljs = require('yamljs')

function parseYmlFile (partialPath) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(process.cwd(), partialPath), (err, data) => {
      if (err) { return reject(err) }
      resolve(yamljs.parse(data.toString('utf-8')))
    })
  })
}

function recursivelyReplaceLocalRefs (obj, refs) {
  if (typeof obj === 'string') { return }
  Object.keys(obj).forEach(key => {
    if (obj[key]['LocalRef']) {
      obj[key] = refs[obj[key]['LocalRef']]
    } else {
      recursivelyReplaceLocalRefs(obj[key], refs)
    }
  })
}

function recursivelyReadYamlPartial (partialDef, currentPath) {
  let partialPath = partialDef
  if (typeof partialDef !== 'string') {
    partialPath = partialDef[0]
  }
  return parseYmlFile(path.resolve(currentPath, partialPath)).then(partial => {
    if (typeof partialDef !== 'string') {
      recursivelyReplaceLocalRefs(partial, partialDef[1])
    }
    return recursivelyReplaceLocalTransforms(partial, currentPath)
  })
}

function recursivelyReplaceLocalTransforms (obj, currentPath) {
  if (typeof obj !== 'object') { return obj }
  return Promise.all(
    Object.keys(obj).map(key => {
      if (key === 'LocalTransform') {
        return recursivelyReadYamlPartial(obj[key], currentPath).then(partial => {
          Object.assign(obj, partial)
          delete obj[key]
          return obj
        })
      } else {
        return recursivelyReplaceLocalTransforms(obj[key], currentPath)
      }
    })
  ).then(data => {
    return obj
  })
}

module.exports = function (templatePath) {
  const fullPath = path.resolve(process.cwd(), templatePath)
  return parseYmlFile(fullPath)
    .then(template => {
      return recursivelyReplaceLocalTransforms(template, path.dirname(fullPath))
    })
}
