# Machine.json File Creation

This wiki describes how to create machine.json file automatically when you build K8s-Mizar-Mp set up with Alcor Controller and Agents. Section 1 and 2 are from the following web page:  
[https://docs.aws.amazon.com/sdk-for-java/v2/developer-guide/setup-credentials.html](https://docs.aws.amazon.com/sdk-for-java/v2/developer-guide/setup-credentials.html)

Before starting, you need to prepare the following information:

    • AWS_ACCESS_KEY_ID &  AWS_SECRET_ACCESS_KEY
    • AWS EC2 instances and their region information
    • Java 1.8 or above


## 1.Setting AWS Credentials
You can set your credentials for use by the AWS SDK for Java in several ways. However, these are the recommended approaches:

Set credentials in the AWS credentials profile file on your local system, located at: 

      ~/.aws/credentials on Linux, macOS, or Unix 
      C:\Users\USERNAME\.aws\credentials on Windows 

This file should contain lines in the following format:

      [default]
      aws_access_key_id = your_access_key_id
      aws_secret_access_key = your_secret_access_key
       
Substitute your own AWS credentials values for the values your_access_key_id and your_secret_access_key. 

Set the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables. 
To set these variables on Linux, macOS, or Unix, use export : 

      export AWS_ACCESS_KEY_ID=your_access_key_id
      export AWS_SECRET_ACCESS_KEY=your_secret_access_key

To set these variables on Windows, use set : 

      set AWS_ACCESS_KEY_ID=your_access_key_id
      set AWS_SECRET_ACCESS_KEY=your_secret_access_key

## 2. Setting the AWS Region
You should set a default AWS Region to use for accessing AWS services with the AWS SDK for Java. For the best network performance, choose a region that’s geographically close to you (or to your customers). 
Note) If you don’t select a region, service calls that require a region will fail. 
You can use techniques similar to those for setting credentials to set your default AWS Region: 

Set the AWS Region in the AWS config file on your local system, located at:
        ~/.aws/config on Linux, macOS, or Unix
        C:\Users\USERNAME\.aws\config on Windows

This file should contain lines in the following format:

        [default]
        region = your_aws_region

Substitute your desired AWS Region (for example, “us-west-2”) for your_aws_region. 

Set the AWS_REGION environment variable. 

On Linux, macOS, or Unix, use export:

      export AWS_REGION=your_aws_region

On Windows, use set : 

      set AWS_REGION=your_aws_region,       Where your_aws_region is the desired AWS Region name. 

## 3. Setting the AWS Region

Move to AwsClient directory and Build a tool.

    • cd ~/mizar-mp/tools/AwsClient
    • chmod +x ./scripts/*.sh
    • ./scripts/build_tool.sh

Run a tool.

    $>./scriot/run_tool.sh
    $>cat machine.json

