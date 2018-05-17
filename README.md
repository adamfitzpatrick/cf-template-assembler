# cf-template-assembler

Amazon's implementation of modular templates leaves a lot to be desired.  Templates that include transforms don't permit `updateStack` operations, `Parameters` cannot be extracted into a partial, and the syntax is cludgy and non-intuitive.  `cf-template-assembler` is intended to simplify the process by assembling templates locally from template partials using simple syntax. Granted, there are still limitations; this is currently a work in progress.

Currently, this can only handle templates and partials in YAML. Partials must be valid YAML on their own.

## Usage

```javascript
const assembler = require('cf-template-assembler');
const templatePath = '/path/to/main/template.yml';
const template = assembler(templatePath);
```

### LocalTransform

```yaml
LocalTransform: '/path/to/local/partial'
```

or

```yaml
LocalTransform: [ '/path/to/local/partial', { localRef1: value1, localRef2: value2, ... }]
```

`LocalTransform` replaces itself with the contents of a local partial file. It accepts either a single string argument which points to the file path, or an array consisting of the file path, and a key-value map of values for use with `LocalRef`.

Calls to `LocalTransform` can be nested to arbitrary depth.

### LocalRef

```yaml
LocalRef: localRefKey
```

`LocalRef` replaces itself with the value corresponding to the provided key.  This operator can only be used within a template partial inserted by a `LocalTransform` call which includes both the template path and key-value map.

## Example

### partial1.yml

```yaml
---
Parameter1:
  Type: String
  Description: Important parameter
Parameter2:
  Type: String
  Description: Less importand parameter
  Default: value
```

### partial2.yml

```yaml
---
Type: AWS::S3::Bucket
Properties:
  BucketName:
    LocalRef: bucketName
  AccessControl:
    LocalRef: accessControl
  WebsiteConfiguration:
    IndexDocument: index.html
    ErrorDocument: error.html
```

### template.yml

```yaml
---
AWSTemplateFormatVersion: '2010-09-09'
Parameters:
  LocalTransform: /path/to/partial1.yml
Resources:
  ImportandBucket:
    LocalTransform:
    - /path/to/partial2.yml
    - bucketName: MyBucket
      accessControler: PublicRead
```

### Assembled Template

```yaml
---
AWSTemplateFormatVersion: '2010-09-09'
Parameters:
  Parameter1:
    Type: String
    Description: Important parameter
  Parameter2:
    Type: String
    Description: Less importand parameter
    Default: value
Resources:
  ImportandBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: MyBucket
    AccessControl: PublicRead
    WebsiteConfiguration:
      IndexDocument: index.html
      ErrorDocument: error.html
```
