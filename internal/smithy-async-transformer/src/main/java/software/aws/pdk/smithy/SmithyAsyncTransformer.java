package software.aws.pdk.smithy;

import software.amazon.smithy.build.transforms.ConfigurableProjectionTransformer;

import java.util.Set;
import java.util.stream.Collectors;

import software.amazon.smithy.aws.traits.protocols.RestJson1Trait;
import software.amazon.smithy.build.TransformContext;
import software.amazon.smithy.model.Model;
import software.amazon.smithy.model.pattern.UriPattern;
import software.amazon.smithy.model.shapes.OperationShape;
import software.amazon.smithy.model.shapes.ServiceShape;
import software.amazon.smithy.model.shapes.ShapeId;
import software.amazon.smithy.model.traits.HttpTrait;
import software.amazon.smithy.model.transform.ModelTransformer;

/**
 * Smithy transformer for use prior to the OpenAPI projection for operations with the @async trait
 */
public class SmithyAsyncTransformer extends ConfigurableProjectionTransformer<SmithyAsyncTransformer.Config> {

  public static final class Config {}

  @Override
  public Class<Config> getConfigType() {
    return Config.class;
  }

  @Override
  public String getName() {
    return "aws-pdk-async-transformer";
  }

  @Override
  protected Model transformWithConfig(TransformContext context, Config config) {
    Model model = context.getModel();

    Set<ShapeId> traits = context.getModel().getAppliedTraits();

    // Find all @async traits (can be under an arbitrary namespace depending on customer's chosen namespace)
    Set<ShapeId> asyncTraits = traits.stream().filter(t -> "async".equals(t.getName())).collect(Collectors.toSet());
    Set<ShapeId> websocketJsonTraits = traits.stream().filter(t -> "websocketJson".equals(t.getName())).collect(Collectors.toSet());

    // Map over all shapes in the model
    return ModelTransformer.create().mapShapes(model, (shape) -> {
      if (shape.isOperationShape() && asyncTraits.stream().anyMatch(t -> shape.findTrait(t.toShapeId()).isPresent())) {
        // Shape is an operation, and is marked with the @async trait
        OperationShape op = shape.asOperationShape().get();

        // Add the @http trait in order for it to be included in the OpenAPI projection
        return op.toBuilder().addTrait(HttpTrait.builder()
            .method("POST")
            .uri(UriPattern.parse("/" + op.getId().getName()))
            .build()).build();
      }

      if (shape.isServiceShape() && websocketJsonTraits.stream().anyMatch(t -> shape.findTrait(t.toShapeId()).isPresent())) {
        // Shape is a service, and is marked with the @async trait
        ServiceShape service = shape.asServiceShape().get();

        // Add the @restJson1 trait in order for the service to be included in the OpenAPI projection
        return service.toBuilder().addTrait(RestJson1Trait.builder().build()).build();
      }

      return shape;
    });
  }
}
