package software.aws;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import org.jetbrains.annotations.Nullable;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.pipelines.FileSet;
import software.amazon.awscdk.pipelines.IFileSetProducer;
import software.amazon.jsii.JsiiObjectMapper;
import software.aws.awsprototypingsdk.awspdkpipeline.construct.PDKPipeline;
import software.aws.awsprototypingsdk.awspdkpipeline.construct.PDKPipelineProps;
import software.aws.awsprototypingsdk.awspdkpipeline.construct.SonarCodeScannerConfig;
import software.constructs.Construct;

import java.util.List;
import java.util.function.Function;

public class PipelineStack extends Stack {
    private PDKPipeline pipeline;

    public PipelineStack(Construct scope, String id, @Nullable StackProps props) {
        super(scope, id, props);

        SonarCodeScannerConfig sonarConfig = null;
        Object sonarCtx = this.getNode().tryGetContext("sonarqubeScannerConfig");
        String repositoryName = (String) this.getNode().tryGetContext("repositoryName");

        if (sonarCtx != null) {
            JsonNode ctxJson = JsiiObjectMapper.valueToTree(sonarCtx).get("$jsii.map");

            sonarConfig = SonarCodeScannerConfig.builder()
                    .cfnNagIgnorePath(getNode(ctxJson, "cfnNagIgnorePath", JsonNode::asText))
                    .sonarqubeAuthorizedGroup(getNode(ctxJson, "sonarqubeAuthorizedGroup", JsonNode::asText))
                    .sonarqubeEndpoint(getNode(ctxJson, "sonarqubeEndpoint", JsonNode::asText))
                    .sonarqubeProjectName(getNode(ctxJson, "sonarqubeProjectName", JsonNode::asText))
                    .sonarqubeSpecificProfileOrGateName(getNode(ctxJson, "sonarqubeSpecificProfileOrGateName", JsonNode::asText))
                    .sonarqubeDefaultProfileOrGateName(getNode(ctxJson, "sonarqubeDefaultProfileOrGateName", JsonNode::asText))
                    .preArchiveCommands(getNode(ctxJson, "preArchiveCommands", (node) -> JsiiObjectMapper.INSTANCE.convertValue(node, new TypeReference<List<String>>() {})))
                    .sonarqubeTags(getNode(ctxJson, "sonarqubeTags", (node) -> JsiiObjectMapper.INSTANCE.convertValue(node, new TypeReference<List<String>>() {})))
                    .build();
        }

        this.pipeline = new PDKPipeline(this, "ApplicationPipeline", PDKPipelineProps.builder()
                .primarySynthDirectory("packages/infra/cdk.out")
                .repositoryName(repositoryName != null ? repositoryName : "monorepo")
                .publishAssetsInParallel(false)
                .crossAccountKeys(true)
                .sonarCodeScannerConfig(sonarConfig)
                .synth(new IFileSetProducer() {
                    @Override
                    public @Nullable FileSet getPrimaryOutput() {
                        return null;
                    }
                })
                .build());
    }

    private static <T> T getNode(JsonNode parent, String fieldName, Function<JsonNode, T> supplier) {
        JsonNode node = parent.get(fieldName);
        return node != null ? supplier.apply(node) : null;
    }

    public PDKPipeline getPipeline() {
        return this.pipeline;
    }
}
