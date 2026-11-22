import { App } from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { describe, expect, it } from 'vitest'
import { FilesStack } from '../lib/files-stack'

const template = Template.fromStack(new FilesStack(new App(), 'TestFiles'))

describe('FilesStack', () => {
  it('creates one bucket and no CloudFront distribution', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1)
    template.resourceCountIs('AWS::CloudFront::Distribution', 0)
  })

  it('keeps the bucket when the stack is deleted', () => {
    template.hasResource('AWS::S3::Bucket', { DeletionPolicy: 'Retain', UpdateReplacePolicy: 'Retain' })
  })

  it('never allows public ACLs', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: Match.objectLike({ BlockPublicAcls: true, IgnorePublicAcls: true }),
    })
  })

  it('lets anyone read scores/* and nothing else', () => {
    const [policy] = Object.values(template.findResources('AWS::S3::BucketPolicy'))
    const statements = policy.Properties.PolicyDocument.Statement as { Effect: string; Principal: unknown; Action: unknown; Resource: unknown }[]
    const allows = statements.filter(s => s.Effect === 'Allow')
    expect(allows).toHaveLength(1)
    expect(allows[0].Action).toBe('s3:GetObject')
    expect(JSON.stringify(allows[0].Resource)).toContain('/scores/*')
    expect(JSON.stringify(allows[0].Principal)).toContain('*')
    // No statement allows listing or writing.
    expect(JSON.stringify(allows)).not.toMatch(/ListBucket|PutObject|s3:\*/)
  })

  it('refuses plain-HTTP requests', () => {
    const [policy] = Object.values(template.findResources('AWS::S3::BucketPolicy'))
    expect(JSON.stringify(policy.Properties.PolicyDocument.Statement)).toContain('aws:SecureTransport')
  })

  it('outputs the bucket name and the public URL for the app', () => {
    template.hasOutput('BucketName', {})
    template.hasOutput('ScoresUrl', {})
  })
})
