package software.aws;

import org.jetbrains.annotations.Nullable;
import software.amazon.awscdk.Stage;
import software.amazon.awscdk.StageProps;
import software.constructs.Construct;

public class ApplicationStage extends Stage {

    protected ApplicationStage(Construct scope, String id, @Nullable StageProps props) {
        super(scope, id, props);

        new ApplicationStack(this, "MyAplication", null);
    }
}
