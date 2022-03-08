package software.aws;

import org.jetbrains.annotations.Nullable;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.pipelines.FileSet;
import software.amazon.awscdk.pipelines.IFileSetProducer;
import software.aws.awsprototypingsdk.pdk_pipeline.PDKPipeline;
import software.aws.awsprototypingsdk.pdk_pipeline.PDKPipelineProps;
import software.constructs.Construct;

public class PipelineStack extends Stack {
    private PDKPipeline pipeline;

    public PipelineStack(Construct scope, String id, @Nullable StackProps props) {
        super(scope, id, props);

        this.pipeline = new PDKPipeline(this, "ApplicationPipeline", PDKPipelineProps.builder()
                .primarySynthDirectory("packages/infra/cdk.out")
                .repositoryName("monorepo")
                .publishAssetsInParallel(false)
                .crossAccountKeys(true)
                .synth(new IFileSetProducer() {
                    @Override
                    public @Nullable FileSet getPrimaryOutput() {
                        return null;
                    }
                })
                .build());
    }

    public PDKPipeline getPipeline() {
        return this.pipeline;
    }
}
