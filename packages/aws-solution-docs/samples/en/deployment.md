Before you launch the solution, review the architecture, supported regions, and other considerations discussed in this guide. Follow the step-by-step instructions in this section to configure and deploy the solution into your account.

**Time to deploy**: Approximately [10] minutes

## Deployment overview

Use the following steps to deploy this solution on AWS. 

- Launch the AWS CloudFormation template into your AWS account.
- Review the template parameters, and adjust them if necessary.

## Deployment steps

This automated AWS CloudFormation template deploys the solution in the AWS Cloud.

1. Sign in to the AWS Management Console and use [Launch solution in AWS Standard Regions][launch-template] to launch the AWS CloudFormation template.   
2. The template launches in the US East (N. Virginia) Region by default. To launch this solution in a different AWS Region, use the Region selector in the console navigation bar.
3. On the **Create stack** page, verify that the correct template URL is shown in the **Amazon S3 URL** text box and choose **Next**.
4. On the **Specify stack details** page, assign a valid and account level unique name to your solution stack. This ensures all the resources in the stack remain under the maximum length allowed by CloudFormation. For information about naming character limitations, refer to [IAM and STS Limits][iam-limit] in the `AWS Identity and Access Management User Guide`.
5. Under **Parameters**, review the parameters for the template and modify them as necessary. This solution uses the following default values.

    |      Parameter      |    Default   |                                                      Description                                                      |
    |:-------------------:|:------------:|:--------------------------------------------------------------------------------------------------------------|

6. Choose **Next**.
7. On the **Configure stack options** page, choose **Next**.
8. On the **Review** page, review and confirm the settings. Check the box acknowledging that the template will create AWS Identity and Access Management (IAM) resources.
9. Choose **Create stack** to deploy the stack.

You can view the status of the stack in the AWS CloudFormation Console in the **Status** column. You should receive a CREATE_COMPLETE status in approximately [10] minutes.


