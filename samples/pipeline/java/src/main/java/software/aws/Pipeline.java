package software.aws;

import software.aws.awsprototypingsdk.pdknag.PDKNagApp;
import software.aws.awsprototypingsdk.pdknag.PDKNag;
import software.aws.awsprototypingsdk.pipeline.PDKPipeline;
import software.aws.awsprototypingsdk.pipeline.IsDefaultBranchProps;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.StageProps;

public class Pipeline {
    public static void main(String[] args) {
        PDKNagApp app = PDKNag.app();

        String branchPrefix = PDKPipeline.getBranchPrefix(IsDefaultBranchProps.builder()
                .node(app.getNode())
                .build());

        PipelineStack pipelineStack = new PipelineStack(app, branchPrefix + "PipelineStack", StackProps.builder()
                .env(Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region(System.getenv("CDK_DEFAULT_REGION"))
                        .build())
                .build());

        ApplicationStage devStage = new ApplicationStage(app, branchPrefix + "Dev", StageProps.builder()
                .env(Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region(System.getenv("CDK_DEFAULT_REGION"))
                        .build())
                .build());

        pipelineStack.getPipeline().addStage(devStage);

        // Add additional stages here i.e. Prod
        // if (PDKPipeline.isDefaultBranch(IsDefaultBranchProps.builder()
        //         .node(app.getNode())
        //         .build())) ...

        pipelineStack.getPipeline().buildPipeline(); // Needed for CDK Nag
        app.synth();
    }
}