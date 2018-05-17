const chai = require('chai')
chai.should()
chai.use(require('chai-as-promised'))

describe('cf-template-assembler', () => {
  let assembler

  beforeEach(() => {
    assembler = require('./cf-template-assembler.js')
  })

  it('should return compiled template YAML', () => {
    return assembler('./test-fixtures/template.yml').then(assembledJSON => {
      assembledJSON.should.deep.equal({
        'AWSTemplateFormatVersion': '2010-09-09',
        'Parameters': {
          'Parameter1': {
            'Type': 'String',
            'Description': 'Important parameter'
          },
          'Parameter2': {
            'Type': 'String',
            'Description': 'Less important parameter',
            'Default': 'value'
          }
        },
        'Resources': {
          'ImportantBucket': {
            'Type': 'AWS::S3::Bucket',
            'Properties': {
              'BucketName': 'MyBucket',
              'AccessControl': 'PublicRead',
              'WebsiteConfiguration': {
                'IndexDocument': 'index.html',
                'ErrorDocument': 'error.html'
              }
            }
          }
        }
      })
    })
  })

  it('should throw an error if there is an error reading a YAML source file', () => {
    return assembler('./not-a-file.yml').should.eventually.be
      .rejectedWith('ENOENT: no such file or directory, open \'/Users/adam.fitzpatrick/play/cf-template-assembler/not-a-file.yml\'')
  })
})
