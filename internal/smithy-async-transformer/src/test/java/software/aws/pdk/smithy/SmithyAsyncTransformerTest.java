package software.aws.pdk.smithy;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import software.amazon.smithy.aws.traits.protocols.RestJson1Trait;
import software.amazon.smithy.build.TransformContext;
import software.amazon.smithy.model.Model;
import software.amazon.smithy.model.node.Node;
import software.amazon.smithy.model.shapes.OperationShape;
import software.amazon.smithy.model.shapes.ServiceShape;
import software.amazon.smithy.model.shapes.ShapeId;
import software.amazon.smithy.model.traits.HttpTrait;

public class SmithyAsyncTransformerTest {

  @Test
  public void testSmithyAsyncTransformerAddsHttpTrait() {
    Model model = Model.assembler()
        .addImport(getClass().getResource("async-model.json"))
        .assemble()
        .unwrap();

    Model result = new SmithyAsyncTransformer().transform(TransformContext.builder()
        .model(model)
        .settings(Node.objectNode())
        .build());

    OperationShape operation = result.getShape(ShapeId.from("com.aws#SayHello"))
        .orElseThrow(() -> new RuntimeException()).asOperationShape().orElseThrow(() -> new RuntimeException());

    assertTrue(operation.hasTrait(HttpTrait.ID));
    assertTrue(operation.hasTrait("com.aws#async"));
  }

  @Test
  public void testSmithyAsyncTransformerAddsRestJson1Trait() {
    Model model = Model.assembler()
        .addImport(getClass().getResource("async-model.json"))
        .assemble()
        .unwrap();

    Model result = new SmithyAsyncTransformer().transform(TransformContext.builder()
        .model(model)
        .settings(Node.objectNode())
        .build());

    ServiceShape service = result.getShape(ShapeId.from("com.aws#MyService"))
        .orElseThrow(() -> new RuntimeException()).asServiceShape().orElseThrow(() -> new RuntimeException());

    assertTrue(service.hasTrait(RestJson1Trait.ID));
    assertTrue(service.hasTrait("com.aws#websocketJson"));
  }

}
