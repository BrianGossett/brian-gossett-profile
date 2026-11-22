import { CfnOutput, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import { AnyPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3'
import type { Construct } from 'constructs'

/** The folder of the bucket that anyone may read. Nothing else in the bucket is public. */
export const PUBLIC_PREFIX = 'scores'

/**
 * Storage for files too big for git: the Exam Prep score PDFs (about 874 MB).
 * The site itself stays on Amplify; this bucket only holds the PDFs, which the
 * app links to directly. There is no CloudFront in front of it, to keep cost down.
 */
export class FilesStack extends Stack {
  readonly bucket: Bucket

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    this.bucket = new Bucket(this, 'Files', {
      // Public access comes only from the bucket policy below, never from ACLs.
      blockPublicAccess: new BlockPublicAccess({
        blockPublicAcls: true,
        ignorePublicAcls: true,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      // The bucket outlives the stack: deleting the stack leaves the files in place.
      removalPolicy: RemovalPolicy.RETAIN,
    })

    // Anyone may fetch a score PDF by its link. They cannot list the bucket.
    this.bucket.addToResourcePolicy(new PolicyStatement({
      sid: 'PublicReadScores',
      actions: ['s3:GetObject'],
      principals: [new AnyPrincipal()],
      resources: [this.bucket.arnForObjects(`${PUBLIC_PREFIX}/*`)],
    }))

    new CfnOutput(this, 'BucketName', { value: this.bucket.bucketName })
    new CfnOutput(this, 'ScoresUrl', {
      value: `https://${this.bucket.bucketRegionalDomainName}/${PUBLIC_PREFIX}`,
      description: 'Value for VITE_SCORES_URL',
    })
  }
}
